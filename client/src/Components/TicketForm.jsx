import { useContext, useState } from "react";
import { Form, Button, Alert, Row, Col, Container } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ConstantValuesContext }from "./Context";

const TicketForm = () => {

    const navigate = useNavigate();
    const location = useLocation();
    const ticketToEdit = location.state ? location.state.ticket : undefined;
    const textBlockToEdit = location.state ? location.state.initialTextBlock : undefined;
    const constValues = useContext(ConstantValuesContext);

    // Setting the ticket's values to default values in case of a first attempt of adding a ticket, or the previous value if 
    // the app is coming from the /addTicket/confirm route and did not submitted to the server the new ticket
    const [category, setCategory] = useState(ticketToEdit ? ticketToEdit.category : constValues.Categories.ADMINISTRATIVE);
    const [title, setTitle] = useState(ticketToEdit ? ticketToEdit.title : '');
    const [initialTextBlock, setInitalTextBlock] = useState(textBlockToEdit ? textBlockToEdit : '');

    // setting error to be displayed 
    const [errorMsg, setErrorMsg] = useState([]);
    const [titleErr, setTitleErr] = useState('');
    const [initialTextBlockErr, setInitialTextBlockErr] = useState('')

    const handleSubmit = (event) => {
        event.preventDefault();
        
        // check on title and block length to highlight the form to notify the user about the error
        const titleError = title.length === 0 || title.length > constValues.maxTitleLength ? `Title length must be between 0 and ${constValues.maxTitleLength}` : '';
        const initialTextBlockError = initialTextBlock.trim().length === 0 || initialTextBlock.length > constValues.maxTextBlockLength ? 
        `Initial Text Block length must be between 0 and ${constValues.maxTextBlockLength }` : '';
       
        if(!titleError && !initialTextBlockError) {
            const ticket = { state: constValues.States.OPEN, category: category, title: title }; 
            navigate('/addTicket/confirm', { state: Object.assign({}, {ticket: ticket}, {initialTextBlock: initialTextBlock}) });
        } else {
            // highlighting the form to show the errors

            setTitleErr(titleError); 
            setInitialTextBlockErr(initialTextBlockError);
        }


    }

    return (
        <>
        {errorMsg ? errorMsg.map((err) => (<Alert key={err.length} variant='danger' onClose={() => setErrorMsg( prevList => prevList.filter(error => error !== err))} dismissible>{err}</Alert>)) : false} 
        <Container fluid style={{ 'marginTop': errorMsg.length === 0 ? '6rem' : '2rem' }} className="d-flex justify-content-center align-items-center">
        

            <Row style={{ display: 'inline-block', alignItems: 'center', width: '60rem' }}>
                <Col style={{ "paddingLeft": "2rem", "paddingRight": "2rem" }} className="align-self-center">
{/* err.length used as key to avoid index changing causing the removal of both errors when the first of the list is closed */}
                    
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label><b>Title</b></Form.Label>
                            <Form.Control isInvalid={titleErr} type="text" value={title} onChange={event => {setTitle(event.target.value); setTitleErr('');}} />
                            <Form.Control.Feedback type="invalid">{titleErr}</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group>
                            <Form.Label><b>Category</b></Form.Label>
                            <Form.Select onChange={event => setCategory(event.target.value)}>
                                <option value={constValues.Categories.ADMINISTRATIVE}>Administrative</option>
                                <option value={constValues.Categories.INQUIRY}>Inquiry</option>
                                <option value={constValues.Categories.MAINTENANCE}>Maintenance</option>
                                <option value={constValues.Categories.NEW_FEATURE}>New Feature</option>
                                <option value={constValues.Categories.PAYMENT}>Payment</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label><b>Initial Text Block</b></Form.Label>
                            <Form.Control isInvalid={initialTextBlockErr} as="textarea" rows={3} value={initialTextBlock} onChange={event => {setInitalTextBlock(event.target.value); setInitialTextBlockErr('');}} />
                                <Form.Control.Feedback type="invalid">
                                        {initialTextBlockErr}
                                    </Form.Control.Feedback>
                        </Form.Group>



                        <Button className="mb-3" variant="warning" type="submit">Save</Button>
                        &nbsp; 
                        <Link to={"/"} >
                            <Button className="mb-3" variant="danger">Cancel</Button>
                        </Link>
                    </Form>

                </Col>
            </Row>
        </Container>
        </>

    );

}





export { TicketForm };