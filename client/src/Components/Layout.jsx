import { Container, Row, Col, Button, Spinner, Navbar, Nav, Alert, Form } from 'react-bootstrap';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { TicketList } from './TicketList';
import { UserContext, UtilFunctionsContext, ConstantValuesContext } from './Context';
import { useContext, useEffect, useState } from 'react';
import API from '../API';

/**
 * Informs the user of the not valid route
 */
function NotFoundLayout() {
    return (
        <>
            <h2>This route is not valid!</h2>
            <Link to="/">
                <Button variant='dark'>Go back to the main page!</Button>
            </Link>
        </>
    );
}

/**
 * Alert shown in case of errors that are "catched" by the app
 */

function ErrorsAlert(props) {

    const handleClose = () => {
        props.clear();
        props.setDirty(true);
    }

    return (
        <Alert variant="danger" dismissible onClose={handleClose} style={{ "margin": "1rem", "marginTop": "1rem" }}>
            {props.errors.length === 1 ? props.errors[0] : ["Errors: ", <br key="br" />, <ul key="ul">
                {
                    props.errors.map((e, i) => <li key={i + ""}>{e}</li>)
                }
            </ul>]}
        </Alert>
    );
}

/**
 * Navigation bar at the top of the app
 * @param props.logout logout function to perform the DELETE of the current session 
 *  
 */

function NavBar(props) {

    const user = useContext(UserContext)
    const location = useLocation();
    const navigate = useNavigate();


    return (
        <Navbar bg="dark" data-bs-theme='dark'>
            <Navbar.Brand className='mx-2'>
                <Button variant='light' className='mx-3' onClick={() => {navigate('/'); props.setDirty(true);}}>
                    <i className="bi bi-ticket mx-2"> Ticketing System</i>
                </Button>
            </Navbar.Brand>
            <Nav className='ms-auto mt-2 mb-3'>
                {location.pathname !== '/login' ? user ? //show only in case of authenticated user in the appropriate route
                    <div>
                        <Navbar.Text >{"Logged in as: " + user.username} | </Navbar.Text>
                        <Link to='/'>
                            <Button className='mx-2' size='sm' variant='outline-danger' onClick={props.logout}>Logout</Button>
                        </Link>
                    </div> :
                    <Link to='/login'>
                        <Button className='mx-2' size='sm' variant='outline-warning'>Login</Button>
                    </Link> : ''}
            </Nav>
        </Navbar>
    );
}

/**
 * props to initialize the contexts
 * @param props.user
 * @param props.utilFunctions
 * @param props.constantValues 
 * 
 * @param props.logout logout function
 * @param props.errors list of errors
 * @param props.clearErrors function to clear the list of errors
 * 
 * The componenet represents the generic rendering layout of the APP (navbar at the top and the content is rendered in the Outlet tag)
 */

function GenericLayout(props) {
    return (
        <>
            <UserContext.Provider value={props.user}>
                <UtilFunctionsContext.Provider value={props.utilFunctions}>
                    <ConstantValuesContext.Provider value={props.constantValues}>
                        <Row>
                            <Col>
                                <NavBar logout={props.logout} setDirty={props.utilFunctions.setDirty} />
                            </Col>
                        </Row>
                        {
                            props.errors.length > 0 ? <ErrorsAlert setDirty={props.utilFunctions.setDirty} errors={props.errors} clear={props.clearErrors} /> : false
                        }
                        <Row>
                            <Col>
                                <Outlet />
                            </Col>
                        </Row>
                    </ConstantValuesContext.Provider>
                </UtilFunctionsContext.Provider>
            </UserContext.Provider>

        </>
    );
}

/**
 * 
 * @param props.token JWT token to send to server2 to retrieve the estimation closing time
 * 
 */

function ConfirmTicketLayout(props) {
    const navigate = useNavigate();
    const location = useLocation();
    const ticket = location.state ? location.state.ticket : undefined; // the ticket which has been edited in the /addTicket route is retrieved from location.state
    const initialTextBlock = location.state ? location.state.initialTextBlock : undefined;
    const [estimation, setEstimation] = useState('');
    const user = useContext(UserContext).username;
    const handleErrors = useContext(UtilFunctionsContext).handleErrors;

    /** there will not be warning about unique key propery in TicketTable component */
    ticket.id = -1;
    ticket.estimationTime = estimation;
    ticket.owner = user;
    

    const ticketBlock = {description: initialTextBlock, owner: user, timestamp: ticket.timestamp };

    const addTicket = useContext(UtilFunctionsContext).addTicket;
    /* fetch the estimated closing time in the confirmation page as it was described in the project specifications **/
    useEffect(() => { // will be invoked two times due to react strict mode
        const getEstimation = async () => {

            let token = Object.assign({}, props.token);
            let estimation;
            try {
                estimation = await API.getEstimationTime(token.token, ticket)
            } catch (err) {
                const newToken = await API.getAuthToken();
                estimation = await API.getEstimationTime(newToken.token, ticket);
                props.setAuthToken(newToken);
                
            }

            
            ticket.estimationTime = estimation.estimation;
            setEstimation(estimation.estimation);


        }

        try {
            getEstimation();
        } catch (err) {
            handleErrors(err);
        }

    }, []);


    const handleConfirm = (event) => {
        event.preventDefault();
        

        addTicket(ticket, initialTextBlock);
        navigate('/');
    }


    return (
        <Container style={{ marginTop: '1rem' }} className="d-flex flex-column justify-content-center align-items-center">
            <Row className="w-100">
                <Col>
                    <TicketList ticketList={[ticket]} initialTextBlock={ticketBlock} />
                </Col>
            </Row>
            <Row className="w-100 mt-3">
                <Col className="d-flex justify-content-center">
                    <Form onSubmit={handleConfirm} className="d-flex">
                        <Button variant="warning" type="submit" className="me-2">Submit</Button>
                        <Button variant="danger" onClick={() => navigate('/addTicket', { state: Object.assign({}, {ticket: ticket}, {initialTextBlock: initialTextBlock}) })}>Back</Button>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
}

/** loading spinner shown on first loading of the app */
function LoadingSpinner() {
    return (
        <div className="position-absolute w-100 h-100 d-flex flex-column align-items-center justify-content-center">
            <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
            </Spinner>
        </div>
    );
}


export { NotFoundLayout, GenericLayout, ConfirmTicketLayout, LoadingSpinner };