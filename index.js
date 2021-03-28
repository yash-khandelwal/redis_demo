import express from 'express';
import fetch from 'node-fetch';
import redis from 'redis';

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const redisClient = redis.createClient(REDIS_PORT);

const app = express();

const setResponse = (userName, repos) => {
    return `<h2>${userName} has ${repos} public repos</h2>`;
}

// Cache middleware
const cacheRepos = (req, res, next) => {
    const { userName } = req.params;
    redisClient.get(userName, (err, repos) => {
        if(err) {
            console.log(err.message);
            next();
        }
        if(repos !== null){
            console.log("Found Data in the Cache...");
            res.status(200).send(setResponse(userName, repos));
        } else {
            next();
        }
    })
}

const getRepos = async (req, res, next) => {
    try{
        console.log('Fetching Data from the database...');
        const { userName } = req.params;
        const response = await fetch(`https://api.github.com/users/${userName}`);
        const data = await response.json();
        const repos = data.public_repos;
        // Set data to Redis
        redisClient.setex(userName, 90, repos);
        res.status(200).send(setResponse(userName, repos));
    } catch (error) {
        console.log(error);
    }
}

app.get('/repos/:userName', cacheRepos, getRepos);

app.listen(PORT, () => {
    console.log(`App is running on port: ${PORT}`);
})