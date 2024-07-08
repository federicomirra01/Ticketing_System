'use strict';

import { useState } from "react";
import { Container, Row, Col, Card, Form, FormGroup, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import validator from "validator";

import API from "../API";



function LoginForm(props) {

    /**
     * login page to be displayed on /login route
     * @param props.loginSuccessful set the user as a React state and set also dirty state to true to rehydrate the data
     * to retrieve the additional data for authenticated users
     * 
     */

    const [email, setEmail] = useState('u1@p.it');
    const [password, setPassword] = useState('pwd');
    const [errorMessage, setErrorMessage] = useState('');
    const [emailError, setEmailError] = useState("");
    const [passwordValid, setPasswordValid] = useState(true);
    const [waiting, setWaiting] = useState(false);

    const navigate = useNavigate();

    const doLogIn = (credentials) => {
        API.logIn(credentials).then(user => {
            setErrorMessage('');
            props.loginSuccessful(user);
            navigate('/');
        }).catch(err => setErrorMessage('Wrong Username or Password'))
        .finally(() => setWaiting(false));
    }


    const handleSubmit = (event) => {
        event.preventDefault();

        // Validate form
        const trimmedEmail = email.trim();
        const emailErr = validator.isEmpty(trimmedEmail) ? "Email must not be empty" : (
            !validator.isEmail(trimmedEmail) ? "Not a valid email" : ""
        );
        const passwordVal = !validator.isEmpty(password);

        if (!emailErr && passwordVal) {
            setWaiting(true);
            const credentials = { username: email, password: password }
            doLogIn(credentials);
        } else {
            setEmailError(emailErr);
            setPasswordValid(passwordVal);
        }


    }

    return (
        <>
            {errorMessage ? <Alert style={{ "marginTop": "1rem" }} variant='danger' dismissible onClick={() => setErrorMessage('')}>{errorMessage}</Alert> : ''}
            <Container fluid style={{ marginTop: errorMessage ? "2rem" : "6rem", width: "60rem" }}>
                <Row className="justify-content-evenly">
                    <Card>
                        <Card.Header as="h2">Login</Card.Header>

                        <Form noValidate onSubmit={handleSubmit}>
                            <Row className="mb-3">
                                <FormGroup as={Col} controlId='email'>
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control isInvalid={emailError} type='email' value={email} onChange={ev => { setEmail(ev.target.value); setEmailError("") }}></Form.Control>
                                    <Form.Control.Feedback type="invalid">
                                        {emailError}
                                    </Form.Control.Feedback>
                                </FormGroup>
                            </Row>
                            <Row className="mb-3">
                                <FormGroup controlId='password'>
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control isInvalid={!passwordValid} type='password' value={password} onChange={ev => setPassword(ev.target.value)}></Form.Control>
                                    <Form.Control.Feedback type="invalid">
                                        {'Password must not be empty'}
                                    </Form.Control.Feedback>
                                </FormGroup>
                            </Row>
                            <Button className='my-2' variant="success" type='submit' disabled={waiting}>{
                                waiting ?
                                    <>
                                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                                        {" "}
                                    </>
                                    : false
                            }Login</Button>
                            <Button className='my-2 mx-2' variant='secondary' onClick={() => navigate('/')}>Back</Button>
                        </Form>
                    </Card>
                </Row>
            </Container>
        </>
    );
}

export { LoginForm };