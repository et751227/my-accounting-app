/ api/proxy.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // 將這個替換成你的 Google Apps Script 部署 URL
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxHJcgE1V5unNExnWXbfKnHRm4U_J2z9bfTwwXsPU2-jjx3i9KP8wtWbOuWz4K5RgIf/exec';

  // 處理 GET 請求
  if (req.method === 'GET') {
    try {
      const response = await fetch(SCRIPT_URL);
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch data from Apps Script.' });
    }
  } 
  // 處理 POST 請求
  else if (req.method === 'POST') {
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to post data to Apps Script.' });
    }
  } 
  // 如果收到其他請求，給予適當的回應
  else {
    res.setHeader('Allow', 'GET, POST');
    res.status(405).end('Method Not Allowed');
  }
}
