'use strict';

const db = require('./db');
const dayjs = require("dayjs");
const crypto = require('crypto');

const convertTicketFromDbRecord = (dbRecord) => {
    const ticket = {}
    ticket.id = dbRecord.id;
    ticket.state = dbRecord.state;
    ticket.category = dbRecord.category;
    ticket.title = dbRecord.title;
    ticket.ownerID = dbRecord.ownerID;
    ticket.timestamp = dayjs(dbRecord.timestamp).format('YYYY-MM-DD hh:mm:ss A');

    return ticket;
    
}

const convertTextBlockFromDbRecord = (dbRecord) => {
    const text_block = {}
    text_block.id = dbRecord.id;
    text_block.description = dbRecord.description;
    text_block.timestamp = dayjs(dbRecord.timestamp).format('YYYY-MM-DD hh:mm:ss A');
    text_block.ownerID = dbRecord.ownerID;
    text_block.ticketId = dbRecord.ticketID;
    
    return text_block;

}

// list of all tickets in db for generic user use
exports.listTickets = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM ticket';
        db.all(sql, async (err, rows) => {
            if(err)
                reject(err);
            
            const tickets = await Promise.all(rows.map(async (e) => {
                let ticket = convertTicketFromDbRecord(e);
                const user = await this.getUserById(ticket.ownerID);
                ticket.username = user.username;
                return ticket;
                }));
            tickets.sort((a, b) => dayjs(b.timestamp).diff(dayjs(a.timestamp)));
            resolve(tickets);
        });
    });
}

exports.getTicket = (id) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM ticket WHERE id=?';
        db.get(sql, [id], (err, row) => {
            if(err){
                reject(err);
            }

            if(row == undefined){
                resolve({error: `Ticket with ID ${id} not found`});
            }
            else{
                const ticket = convertTicketFromDbRecord(row);
                resolve(ticket);
            }
        });
    });
}

exports.createTicket = (ticket, ticketBlock) => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
          db.run('BEGIN TRANSACTION'); // This approach has been used to avoid inconsistency while creating a new ticket and the ticket block creation fails,
          // executing a rollback to guarantee database consistency
          
          const sqlInsertTicket = 'INSERT INTO ticket (state, category, ownerID, title, timestamp) VALUES (?, ?, ?, ?, ?)';
          db.run(sqlInsertTicket, [ticket.state, ticket.category, ticket.id_owner, ticket.title, ticket.timestamp], function(err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
    
            const ticketId = this.lastID;
            const sqlInsertTicketBlock = 'INSERT INTO text_block (description, timestamp, ticketId, ownerId) VALUES (?, ?, ?, ?)';
            db.run(sqlInsertTicketBlock, [ticketBlock.description, ticketBlock.timestamp, ticketId, ticketBlock.ownerId], function(err) {
              if (err) {
                db.run('ROLLBACK');
                return reject(err);
              }
    
              db.run('COMMIT', (err) => {
                if (err) {
                  return reject(err);
                }
                resolve(ticketId);
              });
            });
          });
        });
      });
}

//     return new Promise((resolve, reject) => {
//         const sql = 'INSERT INTO ticket (state, category, ownerID, title, timestamp) VALUES(?, ?, ?, ?, ?)';
//         db.run(sql, [ticket.state, ticket.category, ticket.id_owner, ticket.title, ticket.timestamp], function(err){
//             if(err)
//                 reject(err);

            
//             resolve(this.lastID);
            
//         });
//     });
//}



exports.updateTicket = (ticket) => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE ticket SET state=?, category=? WHERE id=?'
        db.run(sql, [ticket.state, ticket.category, ticket.id], function(err){
            if(err)
                reject(err);
    
            else 
                resolve(this.changes);
        });
    });
}

exports.getTextBlocksFromTicket = (ticketId) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM text_block WHERE ticketID=?';
        db.all(sql, [ticketId], async (err, rows) => {
            if(err){
                reject(err);
            }
            else{
                const textBlocks = await Promise.all(rows.map(async (e) => {
                    let textBlock = convertTextBlockFromDbRecord(e);
                    const user = await this.getUserById(e.ownerID);
                    textBlock.username = user.username;
                    return textBlock;
                }));
                textBlocks.sort((a, b) => dayjs(a.timestamp).diff(dayjs(b.timestamp)));
                resolve(textBlocks);
            }
        });
    });
}

exports.getTextBlock = (id) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM text_block WHERE id=?';
        db.get(sql, [id], (err, row) => {
            if(err)
                reject(err);
            else if(row === undefined)
                resolve({error: 'Text Block Not Found'});
            else{
                const textBlock = convertTextBlockFromDbRecord(row);
                resolve(textBlock);
            }
        })
    })
}


exports.createTicketTextBlock = (textBlock) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO text_block (ticketID, ownerID, description, timestamp) VALUES(?, ?, ?, ?)';
        db.run(sql, [textBlock.ticketId, textBlock.ownerId, textBlock.description, textBlock.timestamp], function(err){
            if(err)
                reject(err);
            
            resolve(this.lastID);
        });
    });
}

exports.getUserById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM user WHERE id=?";
        db.get(sql, [id], (err, row) => {
            if(err)
                reject(err);
            else if(row === undefined)
                resolve({error: 'User Not Found'});
            else{
                const user = {id: row.id, email: row.email, username: row.username, level: row.level};
                resolve(user);
            }
        });
    });
}

exports.getUser = (email, password) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM user WHERE email=?";
        db.get(sql, [email], (err, row) => {
            if(err)
                reject(err);
            else if(row === undefined)
                resolve(false);
            else {
                const user = {id : row.id, email: row.email, username: row.username, level: row.level};
                const salt = row.salt;
                crypto.scrypt(password, salt, 16, (err, hashedPassword) => {
                    if(err)
                        reject(err);
                    const passwordHex = Buffer.from(row.hash, 'hex');

                    if(!crypto.timingSafeEqual(passwordHex, hashedPassword))
                        resolve(false);
                    else
                        resolve(user);
                });
            }
        });
    });
}