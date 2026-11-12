require('dotenv').config();

const axios = require('axios');
const express = require('express');
const NodeCache = require('node-cache');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const app = express();
const port = 3000;

const channelId = 'UC_sAYoFHtdQxA7T0GqG6dFg';
const apiKey = process.env.YOUTUBE_API_KEY;

const cache = new NodeCache({ stdTTL: 20, checkperiod: 25 });

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later.'
});

app.use(cors({
    origin: 'https://misticalkai.com'
}));

app.use(limiter);

async function getLiveSubscriberCount(forceRefresh = false) {
    let subscriberCount;

    // Check cache if forceRefresh is not enabled
    if (!forceRefresh) {
        subscriberCount = cache.get('subscriberCount');
        if (subscriberCount) {
            console.log('Using cached subscriber count');
            return subscriberCount;
        }
    }

    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
            params: {
                part: 'statistics',
                id: channelId,
                key: apiKey
            }
        });

        subscriberCount = response.data.items[0].statistics.subscriberCount;

        cache.set('subscriberCount', subscriberCount);
        return subscriberCount;
    } catch (error) {
        console.error('Error fetching subscriber count:', error);
        return 'Error';
    }
}

app.use(express.static('public'));

app.get('/v1/stats/youtube/live-sub-count', async (req, res) => {
    const forceRefresh = req.query.forceRefresh === 'true';
    const subscriberCount = await getLiveSubscriberCount(forceRefresh);

    console.log(`Subscriber count served: ${subscriberCount}`);
    
    res.json({ subscriberCount });
});

module.exports = app;