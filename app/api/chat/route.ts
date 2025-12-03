import { openai } from '@ai-sdk/openai';
import { convertToCoreMessages, streamText } from 'ai';

export async function POST(req: Request) {
  console.log('[Chat API] Request received');

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      console.error('[Chat API] Invalid messages format:', messages);
      return new Response('Invalid request: messages array is required', {
        status: 400,
      });
    }

    console.log('[Chat API] Processing messages:', messages.length);

    // Clean up messages - remove parts field and system message
    const cleanedMessages = messages
      .filter((msg: any) => msg.id !== 'system')
      .map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }));

    console.log('[Chat API] Cleaned messages:', cleanedMessages.length);

    // Create the model - using GPT-4o-mini for cost-effective chat
    const model = openai('gpt-4o-mini');
    
    console.log('[Chat API] Creating stream with model');
    
    const result = await streamText({
      model,
      system: `You are a helpful assistant for She Sharp, a non-profit organization dedicated to bridging the gender gap in STEM fields. 

Key information about She Sharp:
- Founded in 2014, empowering women in technology
- 2200+ members, 50+ sponsors, 84+ events since inception
- Core programs: Mentorship Program, THRIVE leadership program, networking events, workshops
- Mission: Connection, Inspiration, and Empowerment for women in STEM
- Services: Career development, job board, community forums, technical workshops

When answering questions:
1. Be friendly, professional, and encouraging
2. Provide accurate information about She Sharp's programs and services
3. Encourage visitors to get involved through membership, mentorship, events, or volunteering
4. Keep responses concise but informative`,
      messages: convertToCoreMessages(cleanedMessages),
      temperature: 0.7,
      maxTokens: 500,
      onFinish: ({ text, usage }) => {
        console.log('[Chat API] Generation finished');
        console.log('[Chat API] Generated text:', text);
        console.log('[Chat API] Token usage:', usage);
      },
    });

    console.log('[Chat API] Returning stream response');
    
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('[Chat API] Error occurred:', error);
    console.error('[Chat API] Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}