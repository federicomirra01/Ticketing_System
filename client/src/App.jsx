import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfirmTicketLayout, GenericLayout, LoadingSpinner, NotFoundLayout } from './Components/Layout.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useEffect, useState } from 'react';
import API from './API.js';
import './App.css'
import { LoginForm } from './Components/Auth.jsx';
import { TicketForm } from './Components/TicketForm.jsx';
import { TicketList } from './Components/TicketList.jsx';
import dayjs from 'dayjs';

function App() {
  /* list of tickets */
  const [ticketList, setTicketList] = useState([]);

  /* Flag the initial loading of the app*/
  const [initialLoading, setInitialLoading] = useState(true);

  /* Flag needed to rehydrate the app (fetch tickets and authToken) */
  const [dirty, setDirty] = useState(false);

  /* Information about the logged in user (undefined in case of not logged in) */
  const [user, setUser] = useState(undefined);

  /* JWT Token for the server2*/
  const [authToken, setAuthToken] = useState(undefined);

  /* flag to rehydrate textBlocks in case of add of a new text block without close and re-open of the Accordion*/
  const [dirtyBlocks, setDirtyBlocks] = useState(false);

  /* list of errors */
  const [errors, setErrors] = useState([]);

  /* flag to visualize a loading spinner near the refresh button for an authenticated user*/
  const [loading, setLoading] = useState(false);

  /* Constant admissible values: States and Categories*/
  const States = {
    OPEN: 1,
    CLOSED: 0
  };

  const Categories = {
    INQUIRY: 'Inquiry',
    MAINTENANCE: 'Maintenance',
    NEW_FEATURE: 'New feature',
    ADMINISTRATIVE: 'Administrative',
    PAYMENT: 'Payment'
  };

  /* fetch the tickets at mount time (used to display tickets in the home page for the generic user (not authenticated) */
  useEffect(() => {

    API.getTickets().then(tickets => setTicketList(tickets)).catch(err => handleErrors(err))
      .finally(setInitialLoading(false));

    /** Comment the following to allow to check the correctness in case of multiuser operations */
    // API.getUserInfo().then(user => { //check if user already authenticated and retrieve token
    //   setUser(user);
    //   API.getAuthToken().then(token => setAuthToken(token)).catch(err => handleErrors(err));
    // }).catch(err => {
    //   if(err.error !== 'Not Authenticated user')
    //     handleErrors(err.err);
    //   })

  }, []);

  /* fetch triggered by dirty dependency that retrieve from server tickets and authToken*/
  useEffect(() => {
    const getTickets = async () => {

      setLoading(true);
      const tickets = await API.getTickets();
      if (user) {
        let newTickets = [];
        let token = Object.assign({}, authToken);

        if (authToken === undefined) { // situation after logout that and successive login resulting in not rerendering the component and not getting the authToken 
          const tokenResponse = await API.getAuthToken();
          token = Object.assign({}, tokenResponse)
          setAuthToken(token); // setAuthToken is asynchronous, another variable is needed to refer to a new token
        }
        if (token && token.authLevel === 'admin') {
          newTickets = await Promise.all(tickets.map(async (e) => {
            if (e.state === States.OPEN) {
              let estimation;
              try {
                estimation = await (API.getEstimationTime(token.token, e));
              } catch (err) {
                token = await API.getAuthToken(); // renewing token
                setAuthToken(token);
                estimation = await API.getEstimationTime(token.token, e);
              }

              
              return Object.assign({}, e, { estimationTime: estimation.estimation });

            } else
              return Object.assign({}, e);
          })
          );
          setTicketList(newTickets);


        } else
          setTicketList(tickets);
      } else {
        setTicketList(tickets);
      }
      setLoading(false);
      setDirty(false);

    }

    if (dirty) {
      try {
        getTickets();
      }
      catch (err) {
        handleErrors(err);
      }

    }

  }, [dirty]);


  const handleErrors = (err) => {
    setErrors(errList => [...errList, err.error]);
  }


  const loginSuccessful = (user) => {
    setUser(user);
    setDirty(true);
  }

  const doLogOut = async () => {
    try {
      await API.logOut();
      setUser(undefined);
      setAuthToken(undefined);
      setDirty(true);
    } catch (err) {
      handleErrors(err);
    }
  }


  /** 
    * @param ticket ticket composed by all tickets attributes plus the initial block which will be inserted in a different table in the backend
    * This solution has been selected to avoid to call two different API's for adding a ticket and a ticket block (since they are stored in different tables in the database)
    * The primary reason is that the ticket block needs the id of the ticket that will be given as result of the INSERT transaction, so inserting an additional parameter in the JSON
    * let the app avoid to call two different API's where, before calling the second one the ticketId (result of the first one) must be inserted in the ticketBlock object  
  */

  const addTicket = async (ticket, initiaTextBlock) => {

    try {
      delete ticket.id;
      delete ticket.estimationTime;
      await API.addTicket(ticket, initiaTextBlock);
      setDirty(true);
    } catch (err) {
      handleErrors(err);
    }
  }

  /**
   * @param ticket ticket to be updated, only the ticket state is and id is given as input at the API because are the only needed values
   *  */
  const updateTicketState = async (ticket) => {

    try {
      const updatedTicket = {
        id: ticket.id,
      }

      updatedTicket.state = ticket.state === States.OPEN ? States.CLOSED : States.OPEN;
      await API.updateTicket(updatedTicket);
      setDirty(true);
    } catch (err) {
      handleErrors(err);
    }
  }
  /**
   * @param ticket ticket to be updated, only the ticket category is and id is given as input at the API because are the only needed values
   *  */
  const updateTicketCategory = async (ticket, newCategory) => {
    try {
      const updatedTicket = {
        id: ticket.id,
        category: newCategory,
      }
      await API.updateTicket(updatedTicket);
      setDirty(true);
    } catch (err) {
      handleErrors(err);
    }
  }

  /**
   * 
   * @param ticketBlock ticketblock containing ticketId (the one it refers to), description and date computed at submission time
   */

  const addTicketBlock = async (ticketBlock) => {
    try {
      await API.addTicketBlock(ticketBlock);
      setDirtyBlocks(true);
    } catch (err) {
      handleErrors(err);
    }
  }

  /**
   * utilities functions that will be used in the routes and will be passed in a Context
   */
  const utilFunctions = {
    addTicket,
    addTicketBlock,
    updateTicketState,
    updateTicketCategory,
    setDirty,
    setDirtyBlocks,
    handleErrors
  }

  const maxTitleLength = 80;
  const maxTextBlockLength = 1024
  /**
   * Constant values that will be passes in a Context
   */
  const constantValues = {
    States,
    Categories,
    maxTitleLength,
    maxTextBlockLength
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<GenericLayout errors={errors} clearErrors={() => setErrors([])}
          user={user} utilFunctions={utilFunctions} constantValues={constantValues} logout={doLogOut} />}>

          <Route index element={initialLoading ? <LoadingSpinner /> :
            <TicketList loading={loading} dirtyBlocks={dirtyBlocks} ticketList={ticketList} />} />

          <Route path='' element={initialLoading ? <LoadingSpinner /> :
            <TicketList loading={loading} dirtyBlocks={dirtyBlocks} ticketList={ticketList} />} />

          <Route path='login' element={<LoginForm loginSuccessful={loginSuccessful} />} />

          <Route path='addTicket' element={<TicketForm />} />

          <Route path='/addTicket/confirm' element={<ConfirmTicketLayout token={authToken} setAuthToken={setAuthToken} />} />

          <Route path='*' element={<NotFoundLayout />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App
