// export async function POST(req) {
//     try {
//       const { image } = await req.json();
  
//       // Process the image as needed
//       const result = { item: 'Apple', quantity: 1 };  // Replace with actual result
  
//       return new Response(JSON.stringify(result), { status: 200 });
//     } catch (error) {
//       console.error('Error analyzing image:', error);
//       return new Response(JSON.stringify({ error: 'hey Failed to analyze image' }), { status: 500 });
//     }
//   }
import { OpenAI } from 'openai';
import * as dotenv from "dotenv";
dotenv.config()

// const configuration = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY,
// });

const openai = new OpenAI();

export async function POST(req) {
    try {
      // Parse the incoming request to get the image data
      const { image } = await req.json();
  
      // Use the OpenAI client to analyze the image
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What’s in this image?" },
              {
                type: "image_url",
                image_url: {
                  url: image, // Pass the image URL directly from the client-side
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      });
  
      // Return the response from OpenAI to the client-side
      return new Response(JSON.stringify(response.choices[0]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      return new Response(JSON.stringify({ error: 'Failed to analyze image' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }