import express from 'express';
import fetch from 'node-fetch';
import redis from 'redis';

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const redisClient = redis.createClient(REDIS_PORT);

const app = express();

const getRepos = async (req, res, next) => {
    try{
        console.log('Fetching Data from the database...');
        const { userName } = req.params;
        const response = await fetch(`https://api.github.com/users/${userName}`);
        const data = await response.json();
        const repos = data.public_repos;
        // Set data to Redis
        redisClient.setex(userName, 90, repos);
        res.send(`<h2>${userName} has ${repos} public repos</h2>`);
    } catch (error) {
        console.log(error);
    }
}

app.get('/repos/:userName', getRepos);

app.listen(PORT, () => {
    console.log(`App is running on port: ${PORT}`);
})