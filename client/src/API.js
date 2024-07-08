'use strict';
const URL = 'http://localhost:3001/api/';

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

async function getTickets() {
    const response = await (fetch(URL + 'tickets'));
    const tickets = await response.json();
    if (response.ok) {
        return tickets.map((e) => {
            const ticket = {
                id: e.id,
                title: capitalizeFirstLetter(e.title),
                owner: e.username,
                state: e.state,
                category: capitalizeFirstLetter(e.category),
                timestamp: e.timestamp
            };
            return ticket;
        });
    } else {
        throw tickets;
    }
}

async function logIn(credentials) {
    const response = await fetch(URL + 'sessions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(credentials)
    });
    if (response.ok) {
        const user = await response.json();
        return user;
    } else {
        const err = await response.json();
        throw err;
    }
}

async function getUserInfo() {
    const response = await fetch(URL + 'sessions/current', {
        credentials: 'include'
    });
    const userInfo = await response.json();
    if (response.ok) {
        return userInfo;
    } else {
        throw userInfo;  // an object with the error coming from the server
    }
}

async function addTicket(ticket, initialTextBlock) {
    const toSend = Object.assign({}, ticket, {initialTextBlock: initialTextBlock});
    const response = await fetch(URL + 'tickets', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(toSend)
    });
    if (!response.ok) {

        const message = await response.json();
        throw { error: message.error || 'Unknown error' };
    }

}

async function logOut() {
    await fetch(URL + 'sessions/current', {
        method: 'DELETE',
        credentials: 'include'
    });
}

async function getTicketBlocks(ticketId) {
    const response = await fetch(URL + `textBlocks/${ticketId}`, { credentials: 'include' });
    const ticketBlocks = await response.json();
    if (response.ok) {
        return ticketBlocks.map((e) => {
            if (!e.msg) { // msg sent from the server where there is no additional block
                const block = {
                    id: e.id,
                    description: capitalizeFirstLetter(e.description),
                    ticketId: e.ticketId,
                    owner: e.username,
                    timestamp: e.timestamp
                };
                return block;
            } else
                return e;
        });
    } else {
        throw ticketBlocks;
    }
}

async function addTicketBlock(ticketBlock) {
    const response = await fetch(URL + 'textBlocks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(Object.assign({}, ticketBlock))
    });
    if (!response.ok) {
        const message = await response.json();

        throw { error: message.error || message[0].msg || 'Unknown error' };
    }

}

async function updateTicket(ticket) {
    const response = await fetch(URL + 'tickets/' + ticket.id, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(Object.assign({}, ticket))
    });

    if (!response.ok) {

        const message = await response.json();
        throw { error: message.error || message[0].msg || 'Unknown error' };
    }
}

async function getAuthToken() {
    const response = await fetch(URL + 'auth-token', {
        credentials: 'include'
    });
    const token = await response.json();
    if (response.ok) {
        return token;
    } else {
        throw token;  // an object with the error coming from the server
    }
}


async function getEstimationTime(authToken, ticket) {
    const response = await fetch('http://localhost:3002/api/estimation', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: ticket.title, category: ticket.category })
    });
    const estimation = await response.json();
    if (response.ok)
        return estimation
    else
        throw estimation;

}


const API = {
    logIn, logOut, getTickets, addTicket, updateTicket, getTicketBlocks,
    addTicketBlock, getAuthToken, getEstimationTime, getUserInfo
};

export default API;