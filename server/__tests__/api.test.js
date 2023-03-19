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
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: testUserEmail,
                password: user.password,
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

    describe('Get Group Messages', () => {
        it('should get messages from a group', async () => {
            const res = await request(app)
                .get(`/message/group/${groupId}`)
                .set('Authorization', `Bearer ${user.token}`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

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

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('content');
    });
});

describe('Get Private Messages', () => {
    it('should get private messages between two users', async () => {
        const res = await request(app)
            .get(`/message/private/${recipient.id}`)
            .set('Authorization', `Bearer ${user.token}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
