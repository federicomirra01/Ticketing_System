-- SQLite
DROP TABLE user;
DROP TABLE ticket;
DROP TABLE text_block;

-- simple user before implementing authentication
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    hash TEXT NOT NULL UNIQUE,
    salt TEXT NOT NULL UNIQUE,
    level TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ticket (
    id INTEGER PRIMARY KEY,
    state INTEGER NOT NULL,
    category TEXT NOT NULL,
    ownerID INT NOT NULL,
    title TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    FOREIGN KEY(ownerID) REFERENCES user(id)
);



CREATE TABLE IF NOT EXISTS text_block  (
    id INTEGER PRIMARY KEY,
    description TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    ticketID INT NOT NULL,
    ownerID INT NOT NULL,
    FOREIGN KEY(ownerID) REFERENCES user(id),
    FOREIGN KEY(ticketID) REFERENCES ticket(id)
);

-- 128 bit salt and 128 bit hash

INSERT INTO user VALUES (1, 'u1@p.it', 'user1', 'cb82d06528fb7eaf59b9fede30df7cc8','d158889db2eb5649bbf2bafee05e737e', 'normal');
INSERT INTO user VALUES (2, 'u2@p.it', 'user2', '0451d2fb86ae6ac9f4893659f94a16ee','ac9e48d6cbd5df21392576293eb4f475', 'normal');
INSERT INTO user VALUES (3, 'u3@p.it', 'user3', 'c206341ecc484c2813a0174d08142627','6dc108d32477125b326b6443e03907d1', 'admin');
INSERT INTO user VALUES (4, 'u4@p.it', 'user4', '70480355f4ebff5a38c1b1f080faa467','ce63b953be2b53df1db4415f705186b9', 'normal');
INSERT INTO user VALUES (5, 'u5@p.it', 'user5', 'daccd7c36a5c5360eecd54dacbd0b90a','c486a33f8fdecc931782222a07de2475', 'admin');


INSERT INTO ticket VALUES (1, 1, 'payment', 1, 'Title payment', '2024-01-17 05:15:22 PM');
INSERT INTO ticket VALUES (2, 0, 'inquiry', 1, 'Title inquiry', '2024-02-17 05:15:22 PM');
INSERT INTO ticket VALUES (3, 1, 'new feature', 2, 'Title new feature', '2024-02-18 05:15:22 PM');
INSERT INTO ticket VALUES (4, 0, 'administrative', 2, 'Title administrative', '2024-02-19 01:15:22 PM');
INSERT INTO ticket VALUES (5, 1, 'maintenance', 3, 'Title maintenance', '2024-03-17 02:15:22 PM');
INSERT INTO ticket VALUES (6, 0, 'new feature', 3, 'Title new feature', '2024-03-17 03:15:22 PM');
 
INSERT INTO text_block VALUES (1, 'Payment block initial', '2024-01-17 05:15:22 PM', 1, 1);
INSERT INTO text_block VALUES (2, 'Inquiry block


space', '2024-02-17 05:15:22 PM', 2, 1);
INSERT INTO text_block VALUES (3, 'Inquiry block additional 1', '2024-03-02 06:22:34 PM', 2, 5);
INSERT INTO text_block VALUES (4, 'Inquiry block final', '2024-05-04 04:22:34 PM', 2, 5);
INSERT INTO text_block VALUES (5, 'New feature block initial', '2024-02-18 05:15:22 PM', 3, 2);
INSERT INTO text_block VALUES (6, 'New feature block 

space', '2024-02-19 06:51:34 PM', 3, 2);
INSERT INTO text_block VALUES (7, 'New feature block final', '2024-02-20 06:22:34 PM', 3, 4);
INSERT INTO text_block VALUES (8, 'Initial block example', '2024-02-19 01:15:22 PM', 4, 2);
INSERT INTO text_block VALUES (9, 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin diam mi, maximus ac tellus a, tincidunt ultrices nisi. Integer erat justo, vulputate a finibus et, efficitur at diam. Cras lorem odio, rutrum at fermentum non, scelerisque dapibus purus. Phasellus sit amet lacus vel lectus gravida aliquet sit amet dignissim nibh. Fusce fringilla ex a neque tempus, vitae finibus est malesuada. Phasellus justo sem, auctor ut est a, iaculis dignissim enim. Etiam pulvinar ornare commodo. Nam vitae ullamcorper turpis, eget dignissim nisi. In hac habitasse platea dictumst. Praesent congue tincidunt ligula, quis tincidunt magna semper volutpat. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Maecenas ut nulla ut massa accumsan placerat. Suspendisse faucibus ultrices neque, ut aliquam sapien molestie semper. Proin a aliquam tellus. ', '2024-03-17 02:15:22 PM', 5, 3);
INSERT INTO text_block VALUES (10, 'Initial Block', '2024-03-17 03:15:22 PM', 6, 3);
