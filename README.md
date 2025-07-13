# FoodMood

**Understand what you eat—organ by organ.**  
FoodMood is an educational web app that visually analyzes how different foods impact the human body, based on specific medical conditions. Using the power of AI, FoodMood makes nutrition more accessible, engaging, and personalized.

---

## What It Does

FoodMood lets users input any food and choose a health condition (like diabetes or IBS). Behind the scenes, the app sends the food and condition to a custom backend powered by OpenAI. The model evaluates the food’s impact on internal organs and returns:

- A **quantitative score** (0–100) for each organ
- An **interactive SVG human body** that lights up affected organs
- An **AI-generated explanation** describing how and why that food impacts each organ in the given condition
- A **chatbot** to ask further food- or condition-related questions

---

## Inspiration

After a family health emergency involving diabetic ketoacidosis, the developer sought to create a tool that demystifies the link between food and physiology. With misinformation, fear-mongering, and dietary overload everywhere, FoodMood aims to cut through the noise by making nutritional knowledge visual, engaging, and science-backed.

---

## Built With

- **Frontend:** HTML, CSS, JavaScript (Vanilla), SVG
- **Backend:** Node.js, Express.js
- **AI:** OpenAI GPT-4 API
- **Deployment:** Vercel (Frontend), Render (Backend)

---

## Challenges

- Mapping abstract physiological responses into organ-specific numeric scores
- Creating an SVG-based interactive body visualization that works across screen sizes and devices
- Avoiding false precision while still keeping explanations educational
- Designing a seamless UI with immediate visual feedback

---

## Accomplishments

- Fully responsive and deployable frontend with no frameworks
- Real-time integration with OpenAI to personalize nutrition explanations
- Clean modular backend with minimal dependencies
- Unique educational tool combining visuals, interactivity, and AI

---

## What's Next

- Support for more conditions (PCOS, hypertension, autoimmune diseases)
- Real food logging and history tracking - likely supabase addition to track user data
- Gamification for classrooms and wellness programs
- Audio narration + accessibility features
- Outreach to partner with nonprofits and health educators

---

## Run Locally

### Clone the repo:
```bash
git clone https://github.com/yourusername/FoodMood-Frontend.git
