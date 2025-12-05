import React, { useState, useEffect } from 'react';
import './Onboarding.css';

interface OnboardingStep {
  title: string;
  description: string;
  target?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "👋 Welcome to MindX AI Assistant",
    description: "This application demonstrates a production-ready AI chat system with RAG (Retrieval-Augmented Generation) and MCP tools integration. Let's take a quick tour!"
  },
  {
    title: "💬 AI Chat Interface",
    description: "The chat uses OpenRouter's GPT-4o-mini for intelligent conversations. Messages stream in real-time, providing natural interaction.",
    target: "chat-section"
  },
  {
    title: "📚 Knowledge Ingestion",
    description: "Add domain-specific knowledge to enhance AI responses. Documents are embedded and stored in Qdrant vector database for RAG.",
    target: "knowledge-section"
  },
  {
    title: "🔍 RAG Search",
    description: "When you ask questions, the system automatically searches the knowledge base and injects relevant context into the AI's response."
  },
  {
    title: "🛠️ MCP Tools",
    description: "The AI can call external tools like weather API, database queries, and knowledge search to provide accurate, up-to-date information."
  },
  {
    title: "📊 API Testing",
    description: "Test protected and public endpoints to understand the authentication flow and API structure.",
    target: "api-grid"
  }
];

const Onboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setTimeout(() => setIsVisible(true), 500);
    } else {
      setIsCompleted(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      scrollToTarget(ONBOARDING_STEPS[currentStep + 1].target);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      scrollToTarget(ONBOARDING_STEPS[currentStep - 1].target);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setIsVisible(false);
    setIsCompleted(true);
  };

  const scrollToTarget = (target?: string) => {
    if (target) {
      setTimeout(() => {
        const element = document.querySelector(`.${target}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const resetOnboarding = () => {
    localStorage.removeItem('hasSeenOnboarding');
    setCurrentStep(0);
    setIsCompleted(false);
    setIsVisible(true);
  };

  if (!isVisible && !isCompleted) return null;

  if (isCompleted) {
    return (
      <button 
        className="onboarding-restart-button" 
        onClick={resetOnboarding}
        title="Restart onboarding tutorial"
      >
        ❓ Help
      </button>
    );
  }

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <>
      <div className="onboarding-overlay" onClick={handleSkip} />
      <div className="onboarding-modal">
        <div className="onboarding-header">
          <div className="onboarding-progress">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              />
            ))}
          </div>
          <button className="onboarding-close" onClick={handleSkip}>
            ✕
          </button>
        </div>

        <div className="onboarding-content">
          <h2>{step.title}</h2>
          <p>{step.description}</p>
        </div>

        <div className="onboarding-footer">
          <div className="onboarding-step-counter">
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </div>
          <div className="onboarding-actions">
            {currentStep > 0 && (
              <button className="onboarding-button secondary" onClick={handlePrev}>
                ← Previous
              </button>
            )}
            <button className="onboarding-button primary" onClick={handleNext}>
              {currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Onboarding;
