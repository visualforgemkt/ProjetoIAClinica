require('dotenv').config();
const AIGateway = require('../src/ai/gateway');

async function testImage() {
  const prompt = "A happy child in a pediatric clinic, professional style";
  console.log("Testing with prompt:", prompt);
  
  try {
    const url = await AIGateway.generateImage({ prompt, clinicId: 'test' });
    console.log("Generated URL:", url);
  } catch (err) {
    console.error("Error generating image:", err);
  }
}

testImage();
