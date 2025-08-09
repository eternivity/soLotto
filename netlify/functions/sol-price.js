exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // CoinGecko API'sini çağır
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    
    if (!response.ok) {
      // Rate limit durumunda fallback fiyat döndür
      if (response.status === 429) {
        console.log('CoinGecko rate limit, returning fallback price');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ solana: { usd: 100 } }),
        };
      }
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error fetching SOL price:', error);
    
    // Hata durumunda fallback fiyat döndür
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ solana: { usd: 100 } }),
    };
  }
};
