import cohere from "cohere-ai";
import { readFile, writeFile } from "node:fs/promises";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.API_KEY;


const isGreeting = (prompt) => {
  const greetings = ['hola', 'buenas', 'saludos', 'qué tal', 'buenos días', 'buenas tardes', 'buenas noches'];
  return greetings.some(greeting => prompt.toLowerCase().includes(greeting));
};

const getGreetingResponse = () => {
  return "Hola, bienvenido a CERVEZARIA PROMPT, donde la pasión y la tecnología se unen para crear cervezas excepcionales. ¿Tienes alguna pregunta sobre nuestras cervezas, el proceso de fabricación o nuestra historia? ¡Pregúntame!";
};


cohere.init(API_KEY);
const enrichPromptWithBreweryContext = (prompt) => {
  return `En CERVEZARIA PROMPT, donde la inteligencia artificial y la tecnología se unen para crear cervezas excepcionales, ${prompt}`;

};

const enrichPromptWithBeerContext = (prompt) => {
  let enrichedPrompt = prompt;
  if (!prompt.toLowerCase().includes('cerveza')) {
    enrichedPrompt = `En el contexto de cervezas, ${enrichedPrompt}`;
  }
  return `${enrichedPrompt}. Responder en español sin hacer referencia a que es asi. `;
};

const generateResponse = async (prompt) => {
  try {
    const breweryContextPrompt = enrichPromptWithBreweryContext(prompt);
    const enrichedPrompt = enrichPromptWithBeerContext(breweryContextPrompt);
    const response = await cohere.generate({
      model: "command",
      prompt: enrichedPrompt,
      max_tokens: 350,
      temperature: 0.9,
      k: 0,



      return_likelihoods: "NONE",
    });
    return response.body.generations[0].text;
  } catch (error) {
    throw new Error("Error al generar la respuesta: " + error.message);
  }
};

// ... Resto del código ...


const isBeerRelated = (prompt) => {
  // Lista de palabras clave relacionadas con cervezas
  const beerKeywords = [
    'cerveza', 'lager', 'ale', 'ipa', 'stout', 'pilsner',
    'barleywine', 'bitter', 'bock', 'porter', 'saison', 'trigo', 'witbier',
    'doble IPA', 'tripel', 'quad', 'kriek', 'gose', 'sour', 'cerveza de frutas',
    'cerveza rubia', 'cerveza oscura', 'cerveza roja', 'cerveza ámbar', 'marzen',
    'fermentación', 'lúpulo', 'malta', 'levadura', 'cervecería', 'microcervecería',
    'homebrew', 'elaboración de cerveza', 'degustación de cervezas', 'maridaje de cervezas',
    'cerveza artesanal', 'cerveza casera', 'cerveza local', 'estilo de cerveza'
  ];
  
  return beerKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
};

const getPredefinedResponse = (prompt) => {
  if (!isBeerRelated(prompt)) {
    return "No tengo información sobre eso, pero puedo contarte sobre diferentes tipos de cervezas. Algunos temas que podrías preguntar incluyen 'IPA', 'Stout', 'Lager', 'Proceso de elaboración', 'Maridaje con comidas', 'Cervezas artesanales', 'Historia de la cerveza', entre otros. ¿Qué te gustaría saber?";
  }
  return null;
};




const addNewMessage = async (client, server) => {
  try {
    const bufferData = await readFile("./db/history.json");
    const objData = JSON.parse(bufferData);
    const newMessage = { client, server };
    const newDataObj = [...objData, newMessage];
    await writeFile("./db/history.json", JSON.stringify(newDataObj));
  } catch (error) {
    throw new Error("Error al guardar el mensaje: " + error.message);
  }
};

const sendRequest = async (req, res) => {
  const body = req.body;
  try {
    let responseText;

    if (isGreeting(body.query)) {
      responseText = getGreetingResponse();
    } else if (isBeerRelated(body.query)) {
      // Si la consulta está relacionada con cerveza, genera una respuesta a través de Cohere
      const enrichedPrompt = enrichPromptWithBeerContext(body.query);
      responseText = await generateResponse(enrichedPrompt);
    } else {
      // Si no es un saludo ni está relacionado con cerveza, utiliza la respuesta predefinida
      responseText = getPredefinedResponse(body.query);
    }

    res.json(responseText);
    addNewMessage(body.query, responseText);
  } catch (error) {
    res.status(500).send(error.message);
  }
};



export { sendRequest };