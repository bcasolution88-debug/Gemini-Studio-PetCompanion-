import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, GenerateVideosOperation } from "@google/genai";
import { MOCK_PETS } from "./src/data/pets.js";

const __dirname = typeof import.meta !== 'undefined' && import.meta.url
  ? path.dirname(fileURLToPath(import.meta.url))
  : process.cwd();

let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required for AI features but was not found.");
    }
    aiClient = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' }
      }
    });
  }
  return aiClient;
}

// Robust fallback helper for model generation to handle temporary 503 / high demand errors
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}) {
  const aiInstance = getAI();
  const modelsToTry = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-3.1-pro-preview"
  ];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      console.log(`Querying model: ${model}`);
      const response = await aiInstance.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (error: any) {
      console.log(`Model ${model} not available, trying next one.`);
      lastError = error;
    }
  }
  throw lastError;
}

// Graceful local fallbacks for high demand / rate-limited environments
function fallbackChatResponse(prompt: string): string {
  const query = prompt.toLowerCase();
  let reply = "";

  if (query.includes("vaccin") || query.includes("shot") || query.includes("immuniz")) {
    reply = "Core vaccinations are critical for pet health! For dogs, this includes Rabies and DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza). For cats, this includes Rabies and FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia). Keep an active record of these dates in your Pet Health Journal to monitor immunization status.";
  } else if (query.includes("food") || query.includes("diet") || query.includes("eat") || query.includes("feed")) {
    reply = "A balanced, high-quality diet suited for your pet's life stage (Puppy/Kitten vs. Adult vs. Senior) is essential. Avoid dangerous foods like chocolate, onions, garlic, grapes, and artificial sweeteners. Ensure fresh water is always available and portion-control meals to prevent obesity.";
  } else if (query.includes("weight") || query.includes("fat") || query.includes("skinny") || query.includes("obese")) {
    reply = "Maintaining a healthy weight prevents joint issues, diabetes, and heart disease. You can evaluate your pet's Body Condition Score (BCS) by feeling their ribs—they should be easily felt but not protruding. Remember to log periodic weight logs in your Pet Health Journal to track weight progression.";
  } else if (query.includes("emerg") || query.includes("vomit") || query.includes("bleeding") || query.includes("pain") || query.includes("letharg")) {
    reply = "If your pet is showing critical warning signs like heavy panting, visible bleeding, continuous vomiting, extreme lethargy, or pain, please locate your nearest 24/7 Emergency Veterinary Clinic immediately. You can check the Nearby Services Map tab to find clinics in your area.";
  } else if (query.includes("train") || query.includes("bark") || query.includes("bite") || query.includes("potty")) {
    reply = "Behavioral and training success relies entirely on patience and positive reinforcement. Reward your pet with high-value treats and praise immediately when they perform the desired behavior. Never use physical discipline, as this breeds fear and anxiety.";
  } else {
    reply = "Welcome to your Pet Assistant! For optimal wellness, make sure your pet gets daily exercise, species-appropriate mental enrichment, regular teeth brushing, and a quiet place to rest. You can use the Wellness Journal to keep track of daily activities, mood logs, and bio-weight progression to earn academic badges!";
  }

  return `${reply}\n\n*(Offline Mode)* Operating in smart local fallback mode due to high Gemini API demand. Always consult a licensed veterinarian for specific pet medical issues. This AI-assistant response is for general educational purposes only and cannot replace professional veterinary advice or in-person diagnosis.`;
}

function fallbackRecommendations(preferences: any, interactedPets: any) {
  return MOCK_PETS.map(pet => {
    let score = 0;
    let reason = "Buddy is a wonderful energetic companion!";
    if (pet.id === '1') reason = "Buddy is a playful puppy, matching active owners looking for energy.";
    if (pet.id === '2') reason = "Luna is a gentle Siamese cat, perfect for a calm and loving indoor environment.";
    if (pet.id === '3') reason = "Charlie is a sweet senior dog, seeking a peaceful and comfortable retirement home.";

    if (preferences && preferences.species) {
      if (preferences.species.toLowerCase() === pet.species.toLowerCase()) {
        score += 3;
      }
    }
    if (preferences && preferences.age) {
      if (preferences.age.toLowerCase() === pet.age.toLowerCase()) {
        score += 2;
      }
    }
    if (preferences && preferences.location) {
      if (pet.location.toLowerCase().includes(preferences.location.toLowerCase()) || 
          preferences.location.toLowerCase().includes(pet.location.toLowerCase())) {
        score += 1;
      }
    }
    if (interactedPets && interactedPets.includes(pet.id)) {
      score += 1;
    }

    return { pet, score, reason };
  })
  .sort((a, b) => b.score - a.score)
  .slice(0, 3)
  .map(item => ({
    petId: item.pet.id,
    reason: `${item.reason} (Recommended by our smart matching engine based on compatible attributes)`
  }));
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/geoip", async (req, res) => {
    try {
      const forwarded = req.headers['x-forwarded-for'];
      let ip = '';
      if (typeof forwarded === 'string') {
        ip = forwarded.split(',')[0].trim();
      } else if (Array.isArray(forwarded) && forwarded.length > 0) {
        ip = forwarded[0].trim();
      } else {
        ip = req.socket.remoteAddress || '';
      }
      
      // Clean up IPv6-wrapped IPv4
      if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
      }

      if (ip === '::1' || ip === '127.0.0.1' || !ip || ip.startsWith('10.') || ip.startsWith('192.168.')) {
        // Localhost/private IP fallback - query server IP or use a standard default
        const response = await fetch('http://ip-api.com/json/');
        const data = await response.json();
        if (data && data.status === 'success') {
          return res.json({
            status: 'success',
            lat: data.lat,
            lon: data.lon,
            city: data.city,
            region: data.regionName || data.region,
            country: data.country
          });
        }
      } else {
        const response = await fetch(`http://ip-api.com/json/${ip}`);
        const data = await response.json();
        if (data && data.status === 'success') {
          return res.json({
            status: 'success',
            lat: data.lat,
            lon: data.lon,
            city: data.city,
            region: data.regionName || data.region,
            country: data.country
          });
        }
      }

      // Default fallback coordinates (San Francisco)
      res.json({
        status: 'fallback',
        lat: 37.7749,
        lon: -122.4194,
        city: 'San Francisco',
        region: 'California',
        country: 'United States'
      });
    } catch (err) {
      console.error('GeoIP resolution error:', err);
      res.json({
        status: 'error',
        lat: 37.7749,
        lon: -122.4194,
        city: 'San Francisco',
        region: 'California',
        country: 'United States'
      });
    }
  });

  app.post("/api/expert-search", async (req, res) => {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }
    try {
      const response = await getAI().models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Provide authoritative veterinary and pet behavior advice for the following question. Cite real medical/behavioral practices and research where appropriate: "${question}"`,
        config: {
          systemInstruction: "You are a world-class veterinary clinician and board-certified veterinary behaviorist (DACVB). Your advice must be accurate, up-to-date, grounded in scientific research, and empathetic. Always provide a clear disclaimer that this advice is for educational purposes only and cannot substitute for an in-person physical examination and diagnosis by a licensed veterinarian.",
          tools: [{ googleSearch: {} }]
        }
      });

      const text = response.text || "No authoritative answer could be generated.";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = chunks.map((chunk: any) => {
        if (chunk.web) {
          return {
            title: chunk.web.title || "Veterinary Resource",
            uri: chunk.web.uri
          };
        }
        return null;
      }).filter(Boolean);

      res.json({ answer: text, sources });
    } catch (error) {
      console.error("Expert search with grounding failed, running smart fallback:", error);
      res.json({
        answer: `Offline Expert Advice:\n\nFor common pet behavior issues like this, experts recommend the following core approaches:\n1. Positive Reinforcement: Always reward good behavior with high-value treats and vocal praise immediately (within 1-2 seconds) to build positive associations.\n2. Environmental Enrichment: Ensure your pet has plenty of mental and physical stimulation (e.g., interactive puzzle toys, licking mats, climbing trees, scheduled daily play and walk routines).\n3. Rule out Medical Issues: Abrupt changes in behavior or extreme actions often stem from underlying pain, discomfort, or medical issues. Always consult with a licensed veterinarian to rule out clinical problems first.\n\nDisclaimer: This is general educational advice. Please consult a licensed professional for a full assessment of your pet's behavioral needs.`,
        sources: [
          { title: "AVMA - Pet Behavior & Care", uri: "https://www.avma.org" },
          { title: "ASPCA - Animal Behaviorist Guidelines", uri: "https://www.aspca.org" }
        ],
        isFallback: true
      });
    }
  });

  app.post("/api/chat", async (req, res) => {
    const { messages } = req.body;
    const prompt = messages[messages.length - 1]?.content || "";
    try {
      const response = await generateContentWithFallback({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "You are a helpful pet assistant. Provide general pet health and care advice. Always include a disclaimer that you cannot replace professional veterinary diagnosis at the end of your response.",
        }
      });
      
      res.json({ reply: response.text });
    } catch (error) {
      console.log("Chat triggered clean local fallback response");
      const reply = fallbackChatResponse(prompt);
      res.json({ reply });
    }
  });

  app.post("/api/recommendations", async (req, res) => {
    const { preferences, interactedPets } = req.body;
    try {
      const prompt = `
        User preferences: ${JSON.stringify(preferences)}
        Pets interacted with: ${JSON.stringify(interactedPets)}
        Available pets for adoption: ${JSON.stringify(MOCK_PETS)}
        
        Analyze these preferences and interactions, and recommend up to 3 pets from the adoption list that would be a "perfect match". 
        Return the result as a JSON array of objects, where each object has a 'petId' and a 'reason' for the recommendation.
      `;
      
      const response = await generateContentWithFallback({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "You are a pet adoption expert. Your goal is to match pets with users based on their preferences and past interactions.",
          responseMimeType: "application/json",
        }
      });
      
      res.json(JSON.parse(response.text));
    } catch (error) {
      console.log("Recommendations triggered clean local matching response");
      const recommendations = fallbackRecommendations(preferences, interactedPets);
      res.json(recommendations);
    }
  });

  app.get("/api/daily-wisdom", async (req, res) => {
    // Note: Since I cannot easily use Firebase Admin SDK without adding it,
    // and the project only has the Web SDK installed (for react),
    // and the server is running in Node.js,
    // I will generate the wisdom and *just return it*, without server-side persistence 
    // for now, until I can properly set up server-side DB access.
    // Or I can use gemini-api to generate it on the fly.
    try {
      const response = await generateContentWithFallback({
        contents: [{ role: "user", parts: [{ text: "Generate a unique, encouraging, short tip about pet care for today." }] }],
        config: {
          systemInstruction: "You are a pet expert. Generate a short, encouraging pet care tip.",
        }
      });
      res.json({ tip: response.text });
    } catch (error) {
      res.json({ tip: "Remember to give your pet plenty of love and attention today!" });
    }
  });

  app.post("/api/generate-caption", async (req, res) => {
    const { imageUrl } = req.body;
    try {
      const imageResponse = await fetch(imageUrl);
      const arrayBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

      const response = await generateContentWithFallback({
        contents: [{ role: "user", parts: [
            { inlineData: { data: base64Image, mimeType } },
            { text: "Generate a short, fun, context-aware caption for this pet photo." }
        ] }],
        config: {
          systemInstruction: "You are a fun pet photographer. Generate a short, fun, context-aware caption for this pet photo.",
        }
      });
      res.json({ caption: response.text });
    } catch (error) {
      console.error(error);
      res.json({ caption: "Look at my adorable pet!" });
    }
  });

  app.post("/api/match-breed", async (req, res) => {
    const { lifestyle, space } = req.body;
    try {
      const response = await generateContentWithFallback({
        contents: [{ role: "user", parts: [
            { text: `Suggest 3 dog or cat breeds based on: Lifestyle: ${lifestyle}, Living Space: ${space}. Return just the breed names and a short reason for each, formatted as a JSON array of objects with {breed, reason}.` }
        ] }],
        config: {
          systemInstruction: "You are a pet breed expert. Suggest 3 dog or cat breeds based on user's lifestyle and living space constraints.",
          responseMimeType: "application/json",
        }
      });
      res.json(JSON.parse(response.text || '[]'));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to match breed" });
    }
  });

  app.post("/api/pet-matching-quiz", async (req, res) => {
    const { answers, pets } = req.body;
    try {
      const prompt = `
        User Lifestyle Questionnaire Responses:
        - Activity Level: ${answers?.activityLevel || 'Moderate'}
        - Housing Environment: ${answers?.housing || 'Standard'}
        - Daily Hours Pet Spend Alone: ${answers?.timeAlone || '3-6 hours'}
        - Experience with Pets: ${answers?.experience || 'Beginner'}
        - Household Members/Animals: ${answers?.household || 'None'}
        - Preferred Species: ${answers?.preferredSpecies || 'Any'}

        Available Shelter Animals in PetGrid:
        ${JSON.stringify((pets || []).map((p: any) => ({ 
          id: p.id, 
          name: p.name, 
          species: p.species, 
          age: p.age, 
          breed: p.breed || 'Unknown', 
          description: p.description, 
          personalityTraits: p.personalityTraits 
        })))}

        Analyze the user's lifestyle preferences.
        Recommend:
        1. profileAnalysis: A general description of their lifestyle profile and the type of pet that would thrive with them.
        2. recommendedBreeds: 3 compatible breed profiles (dogs/cats) with tailored reasons.
        3. petMatches: A list containing matching details for each shelter pet from the provided list, with a percentage compatibility score (0-100) and a customized, detailed explanation (reason) for the score.

        Return ONLY a JSON object with this structure:
        {
          "profileAnalysis": "A friendly, comprehensive analysis of their lifestyle and ideal pet traits.",
          "recommendedBreeds": [
            { "breed": "Breed Name", "species": "Dog/Cat/etc.", "reason": "Tailored explanation why this breed is a great fit." }
          ],
          "petMatches": [
            { "petId": "1", "score": 95, "reason": "Detailed, specific explanation matching Buddy to their home." }
          ]
        }
      `;

      const response = await generateContentWithFallback({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "You are a professional, friendly pet shelter adoption counselor AI. Help match potential adopters with the ideal pet types and specific available shelter animals. Respond strictly in the specified JSON format.",
          responseMimeType: "application/json",
        }
      });

      res.json(JSON.parse(response.text || '{}'));
    } catch (error) {
      console.error("Pet matching quiz failed, using fallback:", error);
      
      // Smart Fallback Local Matching Heuristic
      const availablePets = pets && pets.length > 0 ? pets : MOCK_PETS;
      const prefSpecies = (answers?.preferredSpecies || "Any").toLowerCase();
      const activity = (answers?.activityLevel || "Moderate").toLowerCase();
      
      const petMatches = availablePets.map((p: any) => {
        let score = 75;
        let reasons = [];
        
        if (prefSpecies !== "any" && p.species.toLowerCase() === prefSpecies) {
          score += 15;
          reasons.push(`Matches your preference for a ${p.species}.`);
        } else if (prefSpecies !== "any") {
          score -= 15;
          reasons.push(`A different species than your preferred choice, but holds amazing potential.`);
        }
        
        const petPlay = p.personalityTraits?.playfulness || 50;
        const petEnergy = p.personalityTraits?.energyLevels || 50;
        
        if (activity === "couch potato" || activity === "low activity") {
          if (p.age === "Senior" || petEnergy < 40) {
            score += 10;
            reasons.push("Perfect match for a relaxed household.");
          } else {
            score -= 5;
            reasons.push("This pet might have slightly more energy than you prefer, but can adapt.");
          }
        } else if (activity === "high energy") {
          if (p.age === "Puppy/Kitten" || petEnergy > 70) {
            score += 10;
            reasons.push("Matches your active lifestyle perfectly!");
          } else {
            score -= 5;
            reasons.push("Might be a bit more relaxed than your target energy level, but great for walks.");
          }
        } else {
          score += 5;
          reasons.push("A good balanced fit for your moderate activity level.");
        }
        
        score = Math.max(50, Math.min(98, score));
        
        return {
          petId: p.id,
          score,
          reason: reasons.join(" ") || `A beautiful companion ready to bring happiness into your home.`
        };
      });

      let profileAnalysis = "Based on your preferences, you would make an excellent pet parent! You are seeking a companion that aligns with your lifestyle, and you have a wonderful environment for a pet to thrive.";
      if (activity === "high energy") {
        profileAnalysis = "You are a highly active pet seeker! You will thrive with an energetic companion who can join you on outdoor adventures, jogging, or active fetch sessions.";
      } else if (activity === "couch potato" || activity === "low activity") {
        profileAnalysis = "You appreciate a relaxed, peaceful home environment. A calm, gentle companion (like an adult cat or senior dog) will fit seamlessly into your quiet lifestyle.";
      }

      const recommendedBreeds = [
        { breed: "Golden Retriever", species: "Dog", reason: "Friendly, highly adaptable, and perfect for active families or beginners alike." },
        { breed: "Ragdoll Cat", species: "Cat", reason: "Affectionate, quiet, and extremely docile companion for apartments." },
        { breed: "Siamese", species: "Cat", reason: "Highly intelligent and social pet that loves to interact with its humans." }
      ];

      res.json({
        profileAnalysis,
        recommendedBreeds,
        petMatches
      });
    }
  });

  app.post("/api/analyze-behavior", async (req, res) => {
    const { imageBase64, species } = req.body;
    try {
      if (!imageBase64) {
        return res.status(400).json({ error: "Missing imageBase64" });
      }

      let base64Data = "";
      let mimeType = "image/jpeg";

      if (imageBase64.includes(';base64,')) {
        const parts = imageBase64.split(';base64,');
        mimeType = parts[0].replace('data:', '');
        base64Data = parts[1];
      } else {
        base64Data = imageBase64;
      }

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };

      const promptPart = {
        text: `Analyze this image of a ${species || 'pet'} demonstrating a specific behavior, posture, or movement. 
        Provide a professional, friendly, and strictly non-diagnostic behavioral interpretation. 
        Analyze:
        1. What the visible posture or body language (tail position, ear position, stance, facial expression, movement) suggests about their emotional or mental state (e.g., relaxed, playful, highly alert, anxious, defensive, submissive).
        2. What common situations or environmental triggers usually cause this behavior.
        3. Recommend non-medical bonding, exercise, or environmental tips to support this behavioral state.

        IMPORTANT: Keep it strictly non-diagnostic and helpful for pet parents to understand their pet's mind. Do not diagnose diseases.

        Return ONLY a JSON object with this structure:
        {
          "postureInterpretation": "Detailed explanation of what the body language looks like and what it suggests.",
          "emotionalState": "e.g., Happy & Relaxed / Hyper Alert / Playful Tension / Play Bow / Safe & Sound",
          "triggers": ["Trigger or contextual scenario 1", "Trigger or contextual scenario 2"],
          "tips": ["Care/bonding/training tip 1", "Care/bonding/training tip 2"],
          "disclaimer": "Non-diagnostic interpretation: This automated behavior analysis is for educational and enrichment purposes only. It should not replace physical veterinary observation or professional behavioral consultation."
        }`
      };

      const response = await generateContentWithFallback({
        contents: { parts: [imagePart, promptPart] },
        config: {
          systemInstruction: "You are a professional, empathetic certified pet behaviorist and ethologist AI. Help pet owners understand their pet's body language and movements. Respond strictly in the specified JSON format.",
          responseMimeType: "application/json"
        }
      });

      res.json(JSON.parse(response.text || '{}'));
    } catch (error) {
      console.error("Behavior analysis failed, using fallback:", error);
      
      // Intelligent fallback based on species
      const isDog = (species || "").toLowerCase() === "dog";
      res.json({
        postureInterpretation: isDog 
          ? "The posture indicates focused attention, relaxed ears, and a slightly neutral or happy stance. In dogs, a slightly relaxed mouth and soft eyes denote comfort with their surroundings."
          : "The posture indicates a serene, tucked-in position or observant eye contact. In cats, slow blinking or soft, forward-pointing ears express safety and calm curiosity.",
        emotionalState: isDog ? "Curious & Content" : "Calm & Secure",
        triggers: [
          isDog ? "Anticipating a walk or hearing their owner's friendly voice." : "Warm sunbeams, a quiet room, or observing toys from a high perch.",
          isDog ? "Spotting a toy or observing household action." : "Smelling high-quality treats or feeling safe near their favorite person."
        ],
        tips: [
          isDog ? "Offer interactive puzzle toys to channel their curious focus." : "Practice slow blinking with them to communicate mutual comfort and safety.",
          isDog ? "Combine commands with tasty reward treats to strengthen mental bonds." : "Introduce high-elevation shelves or a window perch for sensory enrichment."
        ],
        disclaimer: "Offline/Fallback Mode: This is a general ethological interpretation based on common dog/cat body language guidelines. It should never replace physical vet inspection or custom trainer instruction."
      });
    }
  });

  app.post("/api/check-symptoms", async (req, res) => {
    const { species, breed, age, symptoms } = req.body;
    try {
      const prompt = `
        Analyze the following pet symptoms and suggest potential common ailments:
        Species: ${species || 'Unknown'}
        Breed: ${breed || 'Unknown'}
        Age: ${age || 'Unknown'}
        Symptoms described: ${symptoms}
        
        Provide a detailed medical analysis in JSON format with exactly the following structure:
        {
          "ailments": [
            {
              "name": "Ailment Name",
              "severity": "Low" | "Medium" | "High",
              "likelihood": "Common" | "Possible" | "Rare",
              "description": "Short explanation of why this matches the symptoms."
            }
          ],
          "reliefTips": [
            "Actionable care tip 1",
            "Actionable care tip 2"
          ],
          "urgency": "Urgent Care Required" | "Monitor Closely" | "Routine Vet Visit Recommended",
          "disclaimer": "This analysis is powered by AI and should not replace professional veterinary consultation or diagnosis."
        }
      `;
      
      const response = await generateContentWithFallback({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "You are a professional, empathetic veterinary AI assistant. Your goal is to analyze symptoms provided by pet owners and suggest possible common ailments, triage severity levels, offer soothing care tips, and provide a strong mandatory disclaimer. You must respond ONLY with the requested JSON format.",
          responseMimeType: "application/json",
        }
      });
      
      res.json(JSON.parse(response.text || '{}'));
    } catch (error) {
      console.error("Symptom check failed, falling back", error);
      
      // Smart Fallback
      const query = (symptoms || "").toLowerCase();
      let ailments = [];
      let reliefTips = [];
      let urgency = "Monitor Closely";
      
      if (query.includes("vomit") || query.includes("puke") || query.includes("diarrhea") || query.includes("stomach")) {
        ailments = [
          {
            name: "Dietary Indiscretion (Gastroenteritis)",
            severity: "Medium",
            likelihood: "Common",
            description: "Often caused by eating spoiled food, garbage, or sudden diet changes."
          },
          {
            name: "Mild Food Sensitivity/Allergy",
            severity: "Low",
            likelihood: "Possible",
            description: "A reaction to a specific ingredient in their daily pet food."
          }
        ];
        reliefTips = [
          "Withhold food for 6-12 hours, then introduce a bland diet (plain boiled white meat chicken and white rice).",
          "Ensure fresh water is available in small increments to prevent dehydration."
        ];
        urgency = "Monitor Closely";
      } else if (query.includes("scratch") || query.includes("itch") || query.includes("bite") || query.includes("flea") || query.includes("skin") || query.includes("hair")) {
        ailments = [
          {
            name: "Allergic Dermatitis",
            severity: "Low",
            likelihood: "Common",
            description: "A response to environmental allergens, food ingredients, or contact substances."
          },
          {
            name: "Flea Bite Hypersensitivity / Parasitic Infestation",
            severity: "Low",
            likelihood: "Common",
            description: "Severe itching caused by flea bites or other external pet parasites."
          }
        ];
        reliefTips = [
          "Apply a pet-safe soothing oatmeal shampoo during baths.",
          "Check skin thoroughly for signs of tiny black flea dirt or crawling insects."
        ];
        urgency = "Routine Vet Visit Recommended";
      } else if (query.includes("cough") || query.includes("sneeze") || query.includes("nose") || query.includes("breathe") || query.includes("breath")) {
        ailments = [
          {
            name: "Infectious Tracheobronchitis (Kennel Cough)",
            severity: "Medium",
            likelihood: "Common",
            description: "Highly contagious upper respiratory disease, often spread in social settings."
          },
          {
            name: "Environmental Allergies or Irritants",
            severity: "Low",
            likelihood: "Possible",
            description: "Slight respiratory reaction to dust, aerosol sprays, perfumes, or tobacco smoke."
          }
        ];
        reliefTips = [
          "Keep the pet in a well-ventilated, dust-free environment.",
          "Use a humidifier to help soothe irritated airways."
        ];
        urgency = "Routine Vet Visit Recommended";
      } else {
        ailments = [
          {
            name: "General Discomfort or Mild Indisposition",
            severity: "Low",
            likelihood: "Possible",
            description: "Mild stress or tiredness that can trigger temporary fatigue."
          }
        ];
        reliefTips = [
          "Provide a quiet, warm, and comfortable sleeping area.",
          "Keep daily routines consistent and monitor appetite and bathroom habits closely."
        ];
        urgency = "Monitor Closely";
      }
      
      res.json({
        ailments,
        reliefTips,
        urgency,
        disclaimer: "Offline/Fallback Mode: This is a localized analysis based on general care guidelines. This should never replace an evaluation by a veterinary professional."
      });
    }
  });

  app.post("/api/identify-pet", async (req, res) => {
    const { imageBase64 } = req.body;
    try {
      const response = await generateContentWithFallback({
        contents: [{ role: "user", parts: [
            { inlineData: { data: imageBase64.split(',')[1], mimeType: "image/jpeg" } },
            { text: "Identify the breed and common health issues based on this image. Return JSON: {breed, symptoms, analysis}." }
        ] }],
        config: {
          systemInstruction: "You are a pet expert. Analyze the image to identify pet breed and potential symptoms or health issues.",
          responseMimeType: "application/json",
        }
      });
      res.json(JSON.parse(response.text || '{}'));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to identify pet" });
    }
  });

  app.post("/api/behavior-tip", async (req, res) => {
    const { species } = req.body;
    try {
      const response = await generateContentWithFallback({
        contents: [{ role: "user", parts: [
            { text: `Generate a short, helpful, context-aware pet training or behavior tip for a ${species || 'pet'}.` }
        ] }],
        config: {
          systemInstruction: "You are a pet behavior expert. Provide a concise, positive, and practical training or behavior tip specifically tailored to the pet's species.",
        }
      });
      res.json({ tip: response.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate tip" });
    }
  });

  app.post("/api/match-score", async (req, res) => {
    const { pet, quizProfile } = req.body;
    try {
      const prompt = `
        Pet Profile: ${JSON.stringify(pet)}
        User Quiz Profile: ${JSON.stringify(quizProfile)}
        Calculate a percentage-based compatibility score (0-100) based on the user's adoption quiz profile and the pet's attributes.
        Return ONLY a JSON object: { "score": number, "reason": string }
      `;
      
      const response = await generateContentWithFallback({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "You are a pet adoption expert. Your goal is to match pets with users based on their preferences.",
          responseMimeType: "application/json",
        }
      });
      
      res.json(JSON.parse(response.text));
    } catch (error) {
      console.error("Match score generation failed", error);
      res.status(500).json({ score: 0, reason: "Could not calculate match score at this time." });
    }
  });

  app.post("/api/generate-insights", async (req, res) => {
    const { entries, petName } = req.body;
    try {
      const prompt = `
        Pet Name: ${petName || 'My Pet'}
        Recent Health & Care Log Entries:
        ${JSON.stringify(entries)}
        
        Analyze these entries and provide a comprehensive wellness summary, trends, and recommended actions or observations. 
        Focus on trends in weight, mood/activity patterns, symptom tags, and general care status.
        Keep the response clear, friendly, and structured. Always remind the user that this is an AI insight and not a replacement for professional veterinary medical advice.
        Return the result as a JSON object with this structure:
        {
          "summary": "Brief overall wellness summary",
          "trends": [
            "Trend or observation 1",
            "Trend or observation 2"
          ],
          "recommendations": [
            "Actionable recommendation 1",
            "Actionable recommendation 2"
          ]
        }
      `;
      
      const response = await generateContentWithFallback({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "You are a professional, caring veterinary consultant AI. Analyze the health logs of the pet and provide custom wellness trends, a short summary, and actionable recommendations in JSON format.",
          responseMimeType: "application/json",
        }
      });
      
      res.json(JSON.parse(response.text || '{}'));
    } catch (error) {
      console.error("Failed to generate health insights, falling back", error);
      // Generate a smart local fallback based on entries
      let summary = `We analyzed the logs for ${petName || 'your pet'}. Overall, they seem to be doing well, but consistency in logging will help build a clearer picture of their long-term health trends.`;
      const trends = ["Consistent log activity recorded."];
      const recommendations = ["Keep up the daily tracking to build a solid health baseline!"];

      if (entries && entries.length > 0) {
        const moods = entries.map((e: any) => e.mood).filter(Boolean);
        const sickCount = moods.filter((m: string) => m.toLowerCase() === 'sick').length;
        const weights = entries.map((e: any) => e.weight).filter((w: any) => w > 0);
        
        if (sickCount > 0) {
          summary = `Noticed some signs of discomfort or illness in recent logs for ${petName || 'your pet'}. Ensure they have plenty of rest and stay hydrated.`;
          trends.push(`Reported 'Sick' mood in ${sickCount} log entry/entries.`);
          recommendations.push("Closely monitor their appetite and bathroom habits. Consult a vet if symptoms persist.");
        } else {
          trends.push("Generally happy or normal mood reported in recent logs.");
        }

        if (weights.length > 1) {
          const firstW = weights[weights.length - 1];
          const lastW = weights[0];
          const diff = lastW - firstW;
          if (Math.abs(diff) > 0.05) {
            trends.push(`Weight trend: ${diff > 0 ? 'gained' : 'lost'} ${Math.abs(diff).toFixed(2)} kg recently.`);
            if (diff < -0.3) {
              recommendations.push("Monitor feed portions. A sudden drop in weight might warrant a check-up.");
            }
          }
        }
      }

      res.json({
        summary,
        trends,
        recommendations,
        isFallback: true
      });
    }
  });

  app.post("/api/personalized-recommendations", async (req, res) => {
    const { pet } = req.body;
    try {
      const prompt = `
        Pet Profile: ${JSON.stringify(pet)}
        Based on the pet's traits (personality, species, age/birthdate), provide personalized recommendations for:
        1. Suitable Toys
        2. Suitable Snacks/Treats
        3. Training Suggestions
        4. Care Tips based on growth stage
        
        Return ONLY a JSON object with this structure: 
        {
          "toys": string[],
          "treats": string[],
          "training": string[],
          "careTips": string[]
        }
      `;
      
      const response = await generateContentWithFallback({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "You are a pet care expert providing personalized recommendations based on pet traits.",
          responseMimeType: "application/json",
        }
      });
      
      res.json(JSON.parse(response.text));
    } catch (error) {
      console.error("Personalized recommendation generation failed", error);
      res.status(500).json({ error: "Could not generate recommendations." });
    }
  });

  app.post("/api/generate-avatar", async (req, res) => {
    const { species, breed } = req.body;
    try {
      const prompt = `An adorable 2D cartoon avatar of a ${breed} ${species}, simple background, high quality.`;
      
      const response = await getAI().models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: { aspectRatio: "1:1" }
        }
      });

      let base64Image = "";
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
      
      if (base64Image) {
        res.json({ imageUrl: base64Image });
      } else {
        throw new Error("No image generated");
      }
    } catch (error) {
      console.error("Avatar generation failed", error);
      res.status(500).json({ error: "Could not generate avatar." });
    }
  });

  app.post("/api/generate-care-infographic", async (req, res) => {
    const { petName, species, breed, age } = req.body;
    try {
      const prompt = `A highly structured, modern, beautifully designed pet care infographic card for a ${age} ${breed || species} named ${petName || 'companion'}. The design must feature soft warm pastel colors, elegant minimalist layout, with clean visual sections, daily routine symbols, healthy food bowl illustration, play ball, heart icon. Text overlay: "${petName}'s Daily Care Guidelines" with checklist points. Professional, eye-safe, cute illustration style.`;
      
      const response = await getAI().models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: { aspectRatio: "3:4" }
        }
      });

      let base64Image = "";
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
      
      if (base64Image) {
        res.json({ imageUrl: base64Image });
      } else {
        throw new Error("No image generated");
      }
    } catch (error) {
      console.error("Infographic generation failed:", error);
      res.status(500).json({ error: "Could not generate care infographic via AI." });
    }
  });

  app.post("/api/generate-virtual-tour", async (req, res) => {
    const { pet } = req.body;
    try {
        const prompt = `A short, engaging 15-second virtual tour video of an adorable ${pet.breed} ${pet.species}, showcasing its personality: ${pet.description}. High quality, cinematic.`;
        const operation = await getAI().models.generateVideos({
            model: 'veo-3.1-lite-generate-preview',
            prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });
        res.json({ operationName: operation.name });
    } catch (error) {
        console.error("Virtual tour generation failed", error);
        res.status(500).json({ error: "Could not generate virtual tour." });
    }
  });

  app.post("/api/virtual-tour-status", async (req, res) => {
    const { operationName } = req.body;
    try {
        const op = new GenerateVideosOperation();
        op.name = operationName;
        const updated = await getAI().operations.getVideosOperation({ operation: op });
        res.json({ done: updated.done });
    } catch (error) {
        console.error("Virtual tour status check failed", error);
        res.status(500).json({ error: "Could not check tour status." });
    }
  });

  app.get("/api/virtual-tour-download", async (req, res) => {
    const operationName = req.query.operationName as string;
    if (!operationName) return res.status(400).send("Missing operationName");
    try {
        const op = new GenerateVideosOperation();
        op.name = operationName;
        const updated = await getAI().operations.getVideosOperation({ operation: op });
        const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
        if (!uri) return res.status(404).send("Video not found");
        
        const videoRes = await fetch(uri, {
            headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY! },
        });
        
        res.setHeader('Content-Type', 'video/mp4');
        const buffer = await videoRes.arrayBuffer();
        res.send(Buffer.from(buffer));
    } catch (error) {
        console.error("Virtual tour download failed", error);
        res.status(500).json({ error: "Could not download virtual tour." });
    }
  });

  app.post("/api/analyze-vision", async (req, res) => {
    const { imageBase64, species } = req.body;
    try {
      if (!imageBase64) {
        return res.status(400).json({ error: "Missing imageBase64" });
      }

      let base64Data = "";
      let mimeType = "image/jpeg";

      if (imageBase64.includes(';base64,')) {
        const parts = imageBase64.split(';base64,');
        mimeType = parts[0].replace('data:', '');
        base64Data = parts[1];
      } else {
        base64Data = imageBase64;
      }

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };

      const promptPart = {
        text: `Analyze this image of a ${species || 'pet'}'s biological condition (e.g., skin, poop, eyelid) or a pet food ingredient list.
        Determine:
        1. Whether this image is a clinical symptom photo (e.g. skin rash, poop irregularity, eye redness) OR a pet food ingredient list.
        2. If it is a symptom photo: identify any abnormal symptoms, potential concerns, care advice, and list suggested simple symptom keywords (e.g., "轻微红肿", "排便异常", "食欲不振") to autofill a health log.
        3. If it is an ingredient list: translate it into simple language if needed, analyze any potential allergen or toxic ingredients (such as grains, colorings, specific preservatives), and list suggested nutritional/allergen keyword tags (e.g. "谷物过敏", "高蛋白标签") to autofill.
        
        Keep it non-diagnostic, friendly, and helpful. Always provide a clear disclaimer.
        
        Return ONLY a JSON object with this structure:
        {
          "analysisType": "symptom" | "ingredients" | "general",
          "title": "Short descriptive title of what is identified (in Chinese)",
          "description": "Comprehensive, structured visual analysis and explanation of the image (in Chinese).",
          "suggestedSymptoms": ["symptom1_in_chinese", "symptom2_in_chinese", ...],
          "alertIngredients": ["allergen1_in_chinese", "allergen2_in_chinese", ...],
          "vetAdvice": "Empathetic homecare or clinical guidance, alerting if a vet visit is needed (in Chinese)."
        }`
      };

      const response = await generateContentWithFallback({
        contents: { parts: [imagePart, promptPart] },
        config: {
          systemInstruction: "You are a professional, empathetic veterinary clinical assistant and multi-modal vision analyzer. Support pet owners in analyzing pet biological photos (skin, stool, eye) or complex pet food nutritional labels in Chinese. Respond strictly in the specified JSON structure.",
          responseMimeType: "application/json"
        }
      });

      res.json(JSON.parse(response.text || '{}'));
    } catch (error) {
      console.error("AI Vision analysis failed, using fallback:", error);
      // Fallback response based on simple heuristic
      res.json({
        analysisType: "general",
        title: "临床与营养表现分析 (离线模型)",
        description: "视觉分析当前运行于本地备用方案。如果您上传的是病症照片（如皮肤、便便），请多留意其日常精神。如果是饲料配料表，请重点排查小麦、牛肉或乳制品等常见过敏源。",
        suggestedSymptoms: ["精神尚佳", "皮肤红斑", "需持续观察"],
        alertIngredients: ["防腐剂残留", "高谷物占比"],
        vetAdvice: "这是临时离线结果。若爱宠出现持续瘙痒、呕吐、精神萎靡或腹泻，请及时预约专业兽医师线下就诊。"
      });
    }
  });

  app.post("/api/calculate-match", async (req, res) => {
    const { pet, quizAnswers } = req.body;
    try {
      if (!pet || !quizAnswers) {
        return res.status(400).json({ error: "Missing pet or quizAnswers" });
      }

      const prompt = `
        Calculate a precise, heartwarming compatibility percentage (0-100) and personalized match feedback between this pet and the user.
        
        Pet Details:
        - Name: ${pet.name}
        - Species: ${pet.species}
        - Age: ${pet.age}
        - Breed: ${pet.breed}
        - Description: ${pet.description}
        - Energy Level: ${pet.personalityTraits?.energyLevels || 'Medium'}%
        - Playfulness: ${pet.personalityTraits?.playfulness || 'Medium'}%
        - Friendliness: ${pet.personalityTraits?.friendliness || 'Medium'}%
        - Good with Dogs: ${pet.goodWithDogs ? 'Yes' : 'No'}
        - Good with Cats: ${pet.goodWithCats ? 'Yes' : 'No'}

        User Quiz Answers:
        - Activity Level: ${quizAnswers.activityLevel || 'Moderate'}
        - Housing Environment: ${quizAnswers.housing || 'Apartment'}
        - Daily Hours Alone: ${quizAnswers.timeAlone || '3-6 hours'}
        - Experience: ${quizAnswers.experience || 'Beginner'}
        - Household Members/Pets: ${quizAnswers.household || 'None'}
        - Preferred Species: ${quizAnswers.preferredSpecies || 'Any'}
        - Budget Focus: ${quizAnswers.budget || 'Moderate'}

        Determine compatibility by checking:
        1. If the user lives in an apartment, is the pet's size and noise level/energy appropriate?
        2. Does the user's daily hours alone fit the pet's attachment/neediness?
        3. Do the user's existing household members/animals match the pet's friendliness/social tolerance?
        4. Does the pet's energy align with the user's activity level?

        Generate:
        1. A score between 60 and 99.
        2. A sweet, warm, reassuring explanation (in Chinese: "因为您...，而...非常...").
        
        Return ONLY a JSON object:
        {
          "score": number,
          "explanation": "A heartwarming, tailored explanation in Chinese connecting their home lifestyle with this specific pet's traits."
        }
      `;

      const response = await generateContentWithFallback({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "You are a professional, warm-hearted pet shelter coordinator AI. Generate compatibility match scores and beautiful, encouraging, personalized explanations in Chinese. Respond strictly in the specified JSON structure.",
          responseMimeType: "application/json"
        }
      });

      res.json(JSON.parse(response.text || '{}'));
    } catch (error) {
      console.error("Match calculation failed, using fallback:", error);
      // Smart offline calculation fallback
      let score = 85;
      if (quizAnswers.housing === 'Apartment' && pet.species === 'Cat') {
        score = 92;
      } else if (quizAnswers.activityLevel === 'High Energy' && pet.personalityTraits?.energyLevels > 70) {
        score = 94;
      }
      res.json({
        score,
        explanation: `因为您过着规律且温暖的生活，而 ${pet.name} 正好是一位温和、适应力极强的伴侣。它的性格与您的作息及居住环境非常默契，相信你们能建立起不可分割的亲密纽带！`
      });
    }
  });

  app.post("/api/generate-routine", async (req, res) => {
    const { petDetails, workday, concerns } = req.body;
    try {
      const prompt = `
        Generate a customized, comprehensive care routine planner for this pet based on details and user schedule:
        - Pet Details: ${petDetails || 'Dog'}
        - Master Workday Schedule: ${workday || '9-to-5'}
        - Special Health/Behavioral Concerns: ${concerns || 'None'}

        Produce a structured, hour-by-hour care schedule for a typical week day. Focus on categories like:
        - "feeding" (Meals, feeding routine)
        - "potty_training" (Bathroom breaks, paper training)
        - "vaccine" (Medical checks, vaccinations)
        - "medical" (Medication, skin check, tummy soothe)
        - "interaction" (Playtime, socialization, desensitization, training)
        - "general" (Rest, grooming, walking)

        Create exactly 6-8 distinct scheduled items covering the day (morning, work hours, evening, night).
        
        Return ONLY a JSON object containing an array:
        {
          "schedule": [
            {
              "time": "HH:MM (e.g., '07:30')",
              "title": "Short title in Chinese (e.g., '喂食营养早餐')",
              "category": "feeding" | "potty_training" | "vaccine" | "medical" | "interaction" | "general",
              "description": "Practical instructions in Chinese customized to concerns and workday schedule (e.g., '喂食温和易消化的幼犬粮，由于有轻微拉肚子，可添加少许益生菌调理。')",
              "frequency": "daily" | "weekly" | "once"
            },
            ...
          ]
        }
      `;

      const response = await generateContentWithFallback({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "You are an expert canine/feline behaviorist and clinical care routine planner. Design custom hour-by-hour schedule elements in Chinese. Respond strictly in the specified JSON structure.",
          responseMimeType: "application/json"
        }
      });

      res.json(JSON.parse(response.text || '{}'));
    } catch (error) {
      console.error("Routine planner generation failed, using fallback:", error);
      // Smart fallback care items
      res.json({
        schedule: [
          {
            time: "07:30",
            title: "早晨温和喂食",
            category: "feeding",
            description: "提供定时定量易消化的宠物粮，由于有特殊关注，可混入益生菌或温水冲泡泡软，保护娇嫩肠胃。",
            frequency: "daily"
          },
          {
            time: "08:15",
            title: "排便训练与清洁",
            category: "potty_training",
            description: "进食后15-20分钟带宠物到指定排便区域，用温柔言语引导，成功后奖励零食或口头表扬。",
            frequency: "daily"
          },
          {
            time: "18:00",
            title: "下班后亲密互动与训练",
            category: "interaction",
            description: "下班回家后进行20分钟温柔互动或触觉脱敏，抚摸爪子与耳朵，缓解独自在家的分离焦虑。",
            frequency: "daily"
          },
          {
            time: "21:00",
            title: "日常健康监测",
            category: "medical",
            description: "仔细检查宠物的皮肤、毛发与精神状况，记录便便软硬度，确保身体平稳恢复健康。",
            frequency: "daily"
          }
        ]
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
