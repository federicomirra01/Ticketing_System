import { useContext, useEffect, useState } from "react";
import { Accordion, Button, Form, Card, Modal, Row, Col, Container, useAccordionButton, Spinner } from "react-bootstrap";
import API from "../API";
import { ConstantValuesContext, UserContext, UtilFunctionsContext } from "./Context";
import { Link, useLocation } from "react-router-dom";

/**
 * 
 * @param props.ticketList list of tickets to be displayed
 * @param props.dirtyBlocks state used to rehydrate in case of not up-to-date blocks (e.g. rehydrat data when adding a new block without closing the accordion)
 * @param props.loading state used to visualize (or not) a spinner while rehydrating data
 *  
 */


function TicketList(props) {
    const tickets = props.ticketList;
    const user = useContext(UserContext);
    const location = useLocation();

    const validLocation = location.pathname !== '/addTicket/confirm';

    return (
        <>
        
        <Container style={{ width: 'auto', marginTop: '1rem' }}  >
        <Row style={{ fontWeight: 'bold', marginBottom: '1rem' } } className="d-flex align-items-center justify-content-end">
            <Col>Title</Col>
            <Col>Category</Col>
            <Col>State</Col>
            <Col>Owner</Col>
            <Col>Timestamp</Col>
            
            {user && validLocation ? /** showing or not the addTicket button depending on location and if authenticated user */
                <Col >           
                           
                               <Link className='ms-auto' to={'/addTicket'}>
                                   <Button variant="light" size="sm" className="my-2 ml-auto"><i className='bi bi-clipboard-plus-fill'> Add Ticket</i></Button>
                               </Link>
                           
                           </Col>
                           
                       : ''}
            
            
        </Row>

        <Accordion defaultActiveKey={-1} alwaysOpen> {/*Default active key used to expand the accordion in the /addTicket/confirm route */}
            {
                tickets.map((t, i, a) => <TicketItem
                    ticket={t}
                    key={t.id}
                    first={i === 0}
                    last={i === a.length - 1}
                    dirtyBlocks={props.dirtyBlocks}
                    loading={props.loading}
                    initialTextBlock={props.initialTextBlock}
                    user={user}
                    validLocation={validLocation}
                />)

            }
        </Accordion>
        </Container >
        </>

    );


}


function TicketItem(props) {

    const [ticketBlocks, setTicketBlocks] = useState([]);
    const [activeKey, setActiveKey] = useState(null);
    const [modalShow, setModalShow] = useState(false); // state to show or not the modal to insert the text for a new textblock
    const [expanded, setExpanded] = useState(false);
    const validLocation = props.validLocation;

    const ticket = props.ticket;
    const user = props.user;
    const updateTicketCategory = useContext(UtilFunctionsContext).updateTicketCategory;
    const constValues = useContext(ConstantValuesContext);
    const setDirtyBlocks = useContext(UtilFunctionsContext).setDirtyBlocks;
    const handleErrors = useContext(UtilFunctionsContext).handleErrors;

    // if authenticated user load all ticket blocks for all tickets to avoid latency when 
    useEffect(() => {
        if (user && validLocation) { // control on valid location otherwise in /addTicket/confirm will be requested ticket blocks for an invalid id
            API.getTicketBlocks(ticket.id).then(b => setTicketBlocks(b)).catch(err => handleErrors(err));
        }
    }, []);

    // rehydrate the ticketBlocks after adding a ticketBlock to a ticket
    useEffect(() => {
        if (user && props.dirtyBlocks) {

            API.getTicketBlocks(ticket.id).then(b => setTicketBlocks(b)).catch(err => handleErrors(err));
            setDirtyBlocks(false);
        }
    }, [props.dirtyBlocks]);



    return (
        <>
                
                <Card >
                    <Card.Body>
                        <Row>
                            <Col>
                                {ticket.title}

                            </Col>
                            <Col>
                                {user && user.level === 'admin' ? /** administrator has functions to modify inline state and category */
                                    
                                        <Form.Group style={{ display: 'inline-block', width: 'auto' }}>
                                            <Form.Select aria-label="Default select example" value={ticket.category} onChange={event => updateTicketCategory(ticket, event.target.value)}>
                                                <option value={constValues.Categories.ADMINISTRATIVE}>Administrative</option>
                                                <option value={constValues.Categories.INQUIRY}>Inquiry</option>
                                                <option value={constValues.Categories.MAINTENANCE}>Maintenance</option>
                                                <option value={constValues.Categories.NEW_FEATURE}>New Feature</option>
                                                <option value={constValues.Categories.PAYMENT}>Payment</option>
                                            </Form.Select>
                                        </Form.Group>
                                    
                                    : <>{ticket.category}</>}
                            </Col>
                            <Col>
                                 <ButtonState constValues={constValues} ticket={ticket} validLocation={validLocation} />
                            </Col>
                                <Col>
                                    <b>{ticket.owner}</b>
                                </Col>
                                <Col>
                                    <b>{ validLocation ? ticket.timestamp : 'N/A'}</b>
                                </Col>
                                
                                        {user && validLocation ? /**conditions to show or not a toggle to expand the ticket to show blocs information */ (
                                            <Col className="d-flex justify-content-end"><CustomToggle setExpanded={setExpanded} setActiveKey={setActiveKey} setTicketBlocks={setTicketBlocks} handleErrors={handleErrors} eventKey={ticket.id}>
                                                <i className={`bi ${expanded ? 'bi-arrow-up-circle-fill' : 'bi-arrow-down-circle-fill'}`}/>
                                            </CustomToggle></Col>
                                        ) : ''}
                                    
                                    </Row>

                                   

                        
                            
                                {user && ticket.estimationTime ? /**shown in homepage for admin and only on /addTicket/confirm route for auth users */
                                    <Row style={{marginTop: "1rem"}}>
                                        <Col><b>Estimated closing time: </b>{ticket.estimationTime}</Col>
                                        </Row> : ''}
                                        {user && activeKey === ticket.id && ticket.state === constValues.States.OPEN /** conditions to show or not a button to add a ticketBlock*/
                                            && validLocation ? (
                                            <Row style={{marginTop : "1rem"}} >
                                                <Col>
                                                <Button size="sm" variant="outline-dark" onClick={() => setModalShow(true)}>
                                                    <i className="bi bi-plus-square-fill"> Add block</i>
                                                </Button>
                                                <ModalButton show={modalShow} onHide={() => setModalShow(false)} ticket={ticket} />
                                                </Col>
                                                </Row>
                                        ) : ''}
                        
    
                            
                        
                    </Card.Body>

                    <Accordion.Collapse eventKey={ticket.id}>
                        <Card.Body>
                            {user ? //user authenticated 
                                !validLocation ? /** /addTicket/confirm route */
                            <TicketBlockItem key={1} ticketBlock={props.initialTextBlock}/>
                            :
                            
                            ticketBlocks.map((block, i) =>  <TicketBlockItem validLocation={validLocation} index={i} key={block.id} ticketBlock={block} />)
                            
                            : ''} {/**key set to 0 to handle the case of no empty blocks */}

                        </Card.Body>
                    </Accordion.Collapse>
                </Card>
        </>
    );
}

// Button that make the accordion (made with Card component) to expand and retrieve from the server the ticketBlocks
function CustomToggle(props) {
    const decoratedOnClick = useAccordionButton(props.eventKey, () => {
        // set the active key to show the Add Block button on the accordion
        props.setActiveKey(prevKey => (prevKey === props.eventKey ? null : props.eventKey));
        props.setExpanded(prevValue => !prevValue);

    });

    return (
        <Button variant="secondary" onClick={decoratedOnClick}>
            {props.children}
        </Button>
    );
}


function ButtonState(props) {
    const user = useContext(UserContext);
    const ticket = props.ticket;
    const outline = user && user.level === 'admin' ? 'outline-' : ''; // different style for admin and generic users
    const updateTicketState = useContext(UtilFunctionsContext).updateTicketState;

    return (
        <Button className="mx-auto"
            disabled={((user && (ticket.owner === user.username) && (ticket.state === props.constValues.States.OPEN)) || (user && (user.level === 'admin')))
                && props.validLocation ? false : true}
            variant={ticket.state === props.constValues.States.OPEN ? `${outline}success` : `${outline}danger`}
            onClick={user ? (event) => { event.stopPropagation(); updateTicketState(ticket) } : null}>{ticket.state === props.constValues.States.OPEN ? 'Open' : 'Closed'}
        </Button>

    );
}

function TicketBlockItem(props) {
    const e = props.ticketBlock;
    return (
        <>

            <Card  style={{ backgroundColor: '#f0f0f0' }}>
             
                <Card.Body>
                {props.validLocation ? <><Card.Text > Submitted by <b>{e.owner}</b> on <b>{e.timestamp}</b></Card.Text>
                <hr/></> : ''}
                    <Card.Text className="text-start" style={{ whiteSpace: 'pre-line' }}>
                        {e.description}
                    </Card.Text>
                </Card.Body>
                
            </Card>
            <hr/>
        </>
    );


}

function ModalButton(props) {

    const [description, setDescription] = useState('');
    const [descriptionErr, setDescriptionErr] = useState('')
    const constValues = useContext(ConstantValuesContext);
    const attributes = Object.assign({}, { show: props.show }, { onHide: props.onHide });
    const addTicketBlock = useContext(UtilFunctionsContext).addTicketBlock;

    const handleBlockClick = (event) => {
        event.preventDefault();

        const descriptionError = description.trim().length === 0 || description.length > constValues.maxTextBlockLength ? `Description length must be between 0 and ${constValues.maxTextBlockLength}` : '';
        if(!descriptionError){
            const ticketBlock = {
                description: description,
                ticketId: props.ticket.id
            };
            props.onHide(); // hide the modal button
            addTicketBlock(ticketBlock); // add ticket block
            setDescription('');
            
        } else {
            setDescriptionErr(descriptionError);
        }

    }


    return (
        <>
            <Modal
                {...attributes}
                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title-vcenter">
                        New Comment for ticket: <b>{props.ticket.title}</b>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Control isInvalid={descriptionErr} as="textarea" rows={10} onChange={event => {setDescription(event.target.value); setDescriptionErr('');}} />
                            <Form.Control.Feedback type="invalid">
                                        {descriptionErr}
                                    </Form.Control.Feedback>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <>
                        <Button variant="outline-success" type='submit' onClick={handleBlockClick}>Submit</Button>
                        <Button variant="outline-danger" onClick={() => {props.onHide(); setDescription('');}}>Close</Button>
                        
                    </>
                </Modal.Footer>
            </Modal>
        </>
    );
}


export { TicketList, TicketBlockItem };