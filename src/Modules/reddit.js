const axios = require('axios');

class Reddit {
    async getPostMediaUrl(url) {
        const response = await axios.get(url);
        const newUrl = `https://www.reddit.com/${response.request.path.split('?')[0]}.json`;

        const newUrlResponse = await axios.get(newUrl);
        
        if(newUrlResponse.data[0].data.children[0].data.is_video) {
            return newUrlResponse.data.children[0].data.media.reddit_video.fallback_url;
        }

        return newUrlResponse.data[0].data.children[0].data.url;
    }
}

module.exports = Reddit;