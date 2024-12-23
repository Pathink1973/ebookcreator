const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { url } = JSON.parse(event.body);
    
    if (!url.includes('wikipedia.org')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Only Wikipedia URLs are supported' }),
      };
    }

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Remove unwanted elements
    $('.mw-editsection').remove();
    $('.reference').remove();
    $('#mw-navigation').remove();
    $('#footer').remove();
    
    const title = $('#firstHeading').text();
    const content = $('#mw-content-text').html();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch content' }),
    };
  }
};
