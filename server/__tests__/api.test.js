const request = require('supertest');
const app = require('../index');
const pool = require('../db');

const randomString = Math.random().toString(36).substring(7);
const testUserEmail = `testuser${randomString}@example.com`;

let user = {
    username: `TestUser${randomString}`,
    email: testUserEmail,
    password: 'password',
    token: '',
};

let groupId;
let recipient;

beforeEach(async () => {
    // Truncate tables in the correct order
    await pool.query('TRUNCATE TABLE group_members CASCADE');
    await pool.query('TRUNCATE TABLE messages CASCADE');
    await pool.query('TRUNCATE TABLE groups CASCADE');
    await pool.query('TRUNCATE TABLE users CASCADE');

    // Register user1
    let res = await request(app)
        .post('/auth/register')
        .send({ username: 'user1', email: testUserEmail, password: 'password' });
    user = { ...res.body.user, token: res.body.token };

    // Register user2
    res = await request(app)
        .post('/auth/register')
        .send({ username: 'user2', email: 'user2@example.com', password: 'password' });
    recipient = { ...res.body.user, token: res.body.token };

    // Create group
    res = await request(app)
        .post('/group/create')
        .set('Authorization', `Bearer ${user.token}`)
        .send({
            name: `Test Group ${randomString}`,
        });

    groupId = res.body.id;
});

describe('User Login', () => {
    it('should log in the user and return a token', async () => {
        // console log the email and password to debug
        console.log('Email:', testUserEmail);
        console.log('Password:', 'password')
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: testUserEmail,
                password: 'password',
            });

        console.log('Login response:', res.body); // Add this line to debug the response

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });
});


describe('Group', () => {
    beforeEach(async () => {
        // Add user and recipient to the group
        await request(app)
            .post(`/group/${groupId}/members`)
            .set('Authorization', `Bearer ${user.token}`)
            .send({ group_id: groupId, user_ids: [user.id, recipient.id] });
    });

    describe('Creation', () => {
        it('should create a new group', async () => {
            const res = await request(app)
                .post('/group/create')
                .set('Authorization', `Bearer ${user.token}`)
                .send({
                    name: `Test Group ${randomString}`,
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('name');
        });
    });

    describe('Join', () => {
        it('should join an existing group', async () => {
            const res = await request(app)
                .post(`/group/${groupId}/members`)
                .set('Authorization', `Bearer ${user.token}`)
                .send({ group_id: groupId, user_ids: [user.id, recipient.id] });

            expect(res.statusCode).toEqual(201);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('Leave', () => {
        it('should leave a group', async () => {
            const res = await request(app)
                .post(`/group/leave/${groupId}`)
                .set('Authorization', `Bearer ${user.token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toBe('Successfully left the group');
        });
    });

    // FAILING
    describe('Get Group Messages', () => {
        it('should get messages from a group', async () => {
            // Add a message to the group before fetching messages
            await request(app)
                .post(`/message/group/${groupId}`)
                .set('Authorization', `Bearer ${user.token}`)
                .send({
                    group_id: groupId,
                    content: `Hello, this is a message from ${user.username}`,
                });
    
            const res = await request(app)
                .get(`/message/group/${groupId}`)
                .set('Authorization', `Bearer ${user.token}`);
    
            expect(res.statusCode).toEqual(200);
            console.log('GET GROUP MESSAGES Response:', res.statusCode, res.body);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });
});

// ... (remaining code remains unchanged)

// FAILING
describe('Send Private Message', () => {
    it('should send a private message', async () => {
        const recipient_id = recipient.id;

        const res = await request(app)
            .post('/message/private')
            .set('Authorization', `Bearer ${user.token}`)
            .send({
                recipient_id: recipient_id,
                content: `Hello, this is a private message from ${user.username}`,
            });
        console.log('SEND PRIVATE MESSAGE Response:', res.statusCode, res.body);


        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('content');
    });
});

// FAILING
describe('Get Private Messages', () => {
    beforeEach(async () => {
        // Send a private message before fetching messages
        await request(app)
            .post('/message/private')
            .set('Authorization', `Bearer ${user.token}`)
            .send({
                recipient_id: recipient.id,
                content: `Hello, this is a private message from ${user.username}`,
            });
    });

    it('should get private messages between two users', async () => {
        const res = await request(app)
            .get(`/message/private/${recipient.id}`)
            .set('Authorization', `Bearer ${user.token}`);
        console.log('GET PRIVATE MESSAGES Response:', res.statusCode, res.body);

        expect(res.statusCode).toEqual(200);
        console.log('res.body:', res.body);
        expect(Array.isArray(res.body)).toBe(true);
    });
});

// Delete a message
// FAILING
describe('Delete Message', () => {
    let messageId;

    beforeEach(async () => {
        const res = await request(app)
            .post('/message/group')
            .set('Authorization', `Bearer ${user.token}`)
            .send({
                group_id: groupId,
                content: `Hello, this is a message from ${user.username}`,
            });
        console.log('DELETE MESSAGE Response:', res.statusCode, res.body);

        messageId = res.body.id;
    });

    it('should delete a message', async () => {
        const res = await request(app)
            .delete(`/user/message/${messageId}`)
            .set('Authorization', `Bearer ${user.token}`);
        console.log('DELETE MESSAGE AFTER Response:', res.statusCode, res.body);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toBe('Message deleted');
    });
});

// Edit a message
// FAILING
describe('Edit Message', () => {
    let messageId;

    beforeEach(async () => {
        const res = await request(app)
            .post('/message/group')
            .set('Authorization', `Bearer ${user.token}`)
            .send({
                group_id: groupId,
                content: `Hello, this is a message from ${user.username}`,
            });
        console.log('EDIT MESSAGE Response:', res.statusCode, res.body);

        messageId = res.body.id;
    });

    it('should edit a message', async () => {
        const res = await request(app)
            .put(`/user/message/${messageId}`)
            .set('Authorization', `Bearer ${user.token}`)
            .send({
                content: `Hello, this is an edited message from ${user.username}`,
            });
        console.log('EDIT MESSAGE AFTER Response:', res.statusCode, res.body);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('content');
        expect(res.body.content).toBe(`Hello, this is an edited message from ${user.username}`);
    });
});

describe("Get User's Groups", () => {
    it("should get a list of user's groups", async () => {
        const res = await request(app)
            .get('/user/groups')
            .set('Authorization', `Bearer ${user.token}`);

        expect(res.statusCode).toEqual(200);
        console.log('res.body:', res.body);
        expect(Array.isArray(res.body.groups)).toBe(true);

    });
});

// Get user's private chats
describe("Get User's Private Chats", () => {
    it("should get a list of user's private chats", async () => {
        const res = await request(app)
            .get('/user/private-chats')
            .set('Authorization', `Bearer ${user.token}`);

        expect(res.statusCode).toEqual(200);
        console.log('res.body:', res.body);
        expect(Array.isArray(res.body.privateChats)).toBe(true);

    });
});

// Update user's profile
describe("Update User's Profile", () => {
    it("should update the user's profile information", async () => {
        const updatedUsername = `UpdatedUsername${randomString}`;
        const updatedEmail = `updated${testUserEmail}`;
        const updatedPassword = 'newpassword';

        const res = await request(app)
            .put('/user/profile')
            .set('Authorization', `Bearer ${user.token}`)
            .send({
                username: updatedUsername,
                email: updatedEmail,
                password: updatedPassword,
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('user');
        expect(res.body.user.username).toBe(updatedUsername);
        expect(res.body.user.email).toBe(updatedEmail);
    });
});

afterAll(() => {
    app.close();
  });
  