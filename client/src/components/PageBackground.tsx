import { useLocation } from "wouter";

interface VariantConfig {
  rays: string;
  aura: string;
  gear: string;
  mesh: string;
  accent: string;
  ornament: string;
  animation?: string;
}

const VARIANTS: Record<string, VariantConfig> = {
  hub: {
    rays: "radial-gradient(ellipse 80% 60% at 30% 20%, oklch(0.55 0.25 192 / 0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 80% at 70% 80%, oklch(0.55 0.24 278 / 0.10) 0%, transparent 70%)",
    aura: "radial-gradient(circle 400px at 50% 40%, oklch(0.72 0.18 192 / 0.08) 0%, transparent 100%)",
    gear: "radial-gradient(circle 300px at 50% 50%, transparent 40%, oklch(0.72 0.18 192 / 0.03) 41%, transparent 42%, transparent 48%, oklch(0.72 0.18 192 / 0.03) 49%, transparent 50%)",
    mesh: "repeating-linear-gradient(0deg, transparent, transparent 80px, oklch(0.55 0.25 192 / 0.02) 80px, oklch(0.55 0.25 192 / 0.02) 81px), repeating-linear-gradient(90deg, transparent, transparent 80px, oklch(0.55 0.25 192 / 0.02) 80px, oklch(0.55 0.25 192 / 0.02) 81px)",
    accent: "conic-gradient(from 0deg at 50% 50%, transparent 0deg, oklch(0.55 0.20 192 / 0.05) 90deg, transparent 180deg, oklch(0.60 0.22 290 / 0.05) 270deg, transparent 360deg)",
    ornament: "radial-gradient(circle 2px at 20% 30%, oklch(0.72 0.18 192 / 0.15) 0%, transparent 100%), radial-gradient(circle 2px at 80% 20%, oklch(0.55 0.24 278 / 0.12) 0%, transparent 100%), radial-gradient(circle 1px at 50% 70%, oklch(0.68 0.18 162 / 0.10) 0%, transparent 100%)",
    animation: "pulse 8s ease-in-out infinite alternate",
  },

  leads: {
    rays: "radial-gradient(ellipse 70% 50% at 50% 10%, oklch(0.55 0.24 278 / 0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 70% at 80% 70%, oklch(0.68 0.18 162 / 0.10) 0%, transparent 70%)",
    aura: "radial-gradient(circle 300px at 60% 50%, oklch(0.60 0.22 290 / 0.07) 0%, transparent 100%)",
    gear: "radial-gradient(circle 2px at 15% 25%, oklch(0.60 0.22 290 / 0.20) 0%, transparent 100%), radial-gradient(circle 2px at 35% 45%, oklch(0.72 0.18 192 / 0.15) 0%, transparent 100%), radial-gradient(circle 2px at 55% 30%, oklch(0.68 0.18 162 / 0.15) 0%, transparent 100%), radial-gradient(circle 2px at 75% 55%, oklch(0.55 0.24 278 / 0.12) 0%, transparent 100%), radial-gradient(circle 2px at 25% 70%, oklch(0.55 0.25 192 / 0.12) 0%, transparent 100%)",
    mesh: "repeating-linear-gradient(45deg, transparent, transparent 60px, oklch(0.60 0.22 290 / 0.02) 60px, oklch(0.60 0.22 290 / 0.02) 61px), repeating-linear-gradient(-45deg, transparent, transparent 60px, oklch(0.68 0.18 162 / 0.02) 60px, oklch(0.68 0.18 162 / 0.02) 61px)",
    accent: "conic-gradient(from 45deg at 50% 50%, transparent 0deg, oklch(0.55 0.24 278 / 0.04) 120deg, transparent 240deg, oklch(0.68 0.18 162 / 0.04) 360deg)",
    ornament: "radial-gradient(ellipse 200px 100px at 30% 60%, oklch(0.55 0.24 278 / 0.06) 0%, transparent 100%)",
  },

  ai: {
    rays: "radial-gradient(ellipse 60% 50% at 20% 30%, oklch(0.55 0.25 192 / 0.15) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 80% 60%, oklch(0.60 0.22 290 / 0.10) 0%, transparent 70%)",
    aura: "radial-gradient(circle 500px at 50% 50%, oklch(0.55 0.25 192 / 0.06) 0%, transparent 100%)",
    gear: "repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 80px, oklch(0.55 0.25 192 / 0.04) 80px, oklch(0.55 0.25 192 / 0.04) 81px, transparent 81px, transparent 90px, oklch(0.55 0.25 192 / 0.03) 90px, oklch(0.55 0.25 192 / 0.03) 91px)",
    mesh: "repeating-linear-gradient(0deg, transparent, transparent 100px, oklch(0.55 0.25 192 / 0.03) 100px, oklch(0.55 0.25 192 / 0.03) 101px), repeating-linear-gradient(90deg, transparent, transparent 100px, oklch(0.60 0.22 290 / 0.03) 100px, oklch(0.60 0.22 290 / 0.03) 101px)",
    accent: "conic-gradient(from 90deg at 50% 50%, transparent 0deg, oklch(0.55 0.25 192 / 0.05) 180deg, transparent 360deg)",
    ornament: "radial-gradient(ellipse 300px 200px at 50% 30%, oklch(0.72 0.18 192 / 0.05) 0%, transparent 100%)",
    animation: "pulse 6s ease-in-out infinite alternate",
  },

  analytics: {
    rays: "radial-gradient(ellipse 70% 40% at 50% 0%, oklch(0.72 0.18 192 / 0.10) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 20% 80%, oklch(0.55 0.20 192 / 0.08) 0%, transparent 70%)",
    aura: "radial-gradient(circle 350px at 30% 50%, oklch(0.72 0.18 192 / 0.06) 0%, transparent 100%)",
    gear: "repeating-linear-gradient(90deg, transparent, transparent 40px, oklch(0.72 0.18 192 / 0.04) 40px, oklch(0.72 0.18 192 / 0.04) 41px, transparent 41px, transparent 80px, oklch(0.55 0.20 192 / 0.03) 80px, oklch(0.55 0.20 192 / 0.03) 81px)",
    mesh: "repeating-linear-gradient(0deg, transparent, transparent 40px, oklch(0.72 0.18 192 / 0.02) 40px, oklch(0.72 0.18 192 / 0.02) 41px)",
    accent: "linear-gradient(135deg, oklch(0.72 0.18 192 / 0.06) 0%, transparent 50%, oklch(0.55 0.20 192 / 0.04) 100%)",
    ornament: "radial-gradient(circle 200px at 80% 20%, oklch(0.72 0.18 192 / 0.05) 0%, transparent 100%)",
  },

  financial: {
    rays: "radial-gradient(ellipse 60% 50% at 50% 20%, oklch(0.70 0.20 85 / 0.10) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 70% 80%, oklch(0.65 0.18 45 / 0.08) 0%, transparent 70%)",
    aura: "radial-gradient(circle 400px at 60% 40%, oklch(0.70 0.20 85 / 0.06) 0%, transparent 100%)",
    gear: "repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 60px, oklch(0.70 0.20 85 / 0.03) 60px, oklch(0.70 0.20 85 / 0.03) 61px, transparent 61px, transparent 100px, oklch(0.65 0.18 45 / 0.02) 100px, oklch(0.65 0.18 45 / 0.02) 101px)",
    mesh: "repeating-linear-gradient(30deg, transparent, transparent 70px, oklch(0.70 0.20 85 / 0.02) 70px, oklch(0.70 0.20 85 / 0.02) 71px)",
    accent: "conic-gradient(from 30deg at 50% 50%, transparent 0deg, oklch(0.70 0.20 85 / 0.04) 120deg, transparent 240deg, oklch(0.65 0.18 45 / 0.04) 360deg)",
    ornament: "radial-gradient(circle 150px at 30% 50%, oklch(0.70 0.20 85 / 0.06) 0%, transparent 100%)",
    animation: "pulse 7s ease-in-out infinite alternate",
  },

  deals: {
    rays: "radial-gradient(ellipse 60% 50% at 50% 15%, oklch(0.68 0.18 162 / 0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 20% 70%, oklch(0.55 0.20 192 / 0.08) 0%, transparent 70%)",
    aura: "radial-gradient(circle 350px at 40% 50%, oklch(0.68 0.18 162 / 0.07) 0%, transparent 100%)",
    gear: "radial-gradient(circle 250px at 50% 50%, transparent 35%, oklch(0.68 0.18 162 / 0.04) 36%, transparent 37%, transparent 45%, oklch(0.68 0.18 162 / 0.03) 46%, transparent 47%)",
    mesh: "repeating-linear-gradient(0deg, transparent, transparent 60px, oklch(0.68 0.18 162 / 0.03) 60px, oklch(0.68 0.18 162 / 0.03) 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, oklch(0.55 0.20 192 / 0.02) 60px, oklch(0.55 0.20 192 / 0.02) 61px)",
    accent: "linear-gradient(180deg, oklch(0.68 0.18 162 / 0.05) 0%, transparent 40%, oklch(0.55 0.20 192 / 0.03) 100%)",
    ornament: "radial-gradient(ellipse 250px 150px at 70% 30%, oklch(0.68 0.18 162 / 0.05) 0%, transparent 100%)",
  },

  integrations: {
    rays: "radial-gradient(ellipse 70% 40% at 30% 10%, oklch(0.55 0.24 278 / 0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 70% at 60% 90%, oklch(0.72 0.18 192 / 0.08) 0%, transparent 70%)",
    aura: "radial-gradient(circle 300px at 50% 50%, oklch(0.55 0.24 278 / 0.06) 0%, transparent 100%)",
    gear: "radial-gradient(circle 2px at 10% 20%, oklch(0.55 0.24 278 / 0.20) 0%, transparent 100%), radial-gradient(circle 2px at 90% 30%, oklch(0.55 0.24 278 / 0.15) 0%, transparent 100%), radial-gradient(circle 2px at 20% 80%, oklch(0.72 0.18 192 / 0.15) 0%, transparent 100%), radial-gradient(circle 2px at 80% 70%, oklch(0.72 0.18 192 / 0.12) 0%, transparent 100%), radial-gradient(circle 2px at 50% 50%, oklch(0.55 0.24 278 / 0.15) 0%, transparent 100%)",
    mesh: "repeating-linear-gradient(0deg, transparent, transparent 50px, oklch(0.55 0.24 278 / 0.03) 50px, oklch(0.55 0.24 278 / 0.03) 51px), repeating-linear-gradient(90deg, transparent, transparent 50px, oklch(0.72 0.18 192 / 0.02) 50px, oklch(0.72 0.18 192 / 0.02) 51px)",
    accent: "conic-gradient(from 0deg at 50% 50%, oklch(0.55 0.24 278 / 0.04) 0deg, transparent 90deg, oklch(0.72 0.18 192 / 0.04) 180deg, transparent 270deg, oklch(0.55 0.24 278 / 0.04) 360deg)",
    ornament: "radial-gradient(ellipse 300px 200px at 50% 50%, oklch(0.55 0.24 278 / 0.04) 0%, transparent 100%)",
  },

  automation: {
    rays: "radial-gradient(ellipse 60% 50% at 50% 10%, oklch(0.55 0.25 192 / 0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 80% 70%, oklch(0.55 0.20 192 / 0.08) 0%, transparent 70%)",
    aura: "radial-gradient(circle 400px at 50% 30%, oklch(0.55 0.25 192 / 0.06) 0%, transparent 100%)",
    gear: "repeating-linear-gradient(90deg, transparent, transparent 30px, oklch(0.55 0.25 192 / 0.05) 30px, oklch(0.55 0.25 192 / 0.05) 31px, transparent 31px, transparent 60px, oklch(0.55 0.20 192 / 0.03) 60px, oklch(0.55 0.20 192 / 0.03) 61px)",
    mesh: "repeating-linear-gradient(0deg, transparent, transparent 30px, oklch(0.55 0.25 192 / 0.03) 30px, oklch(0.55 0.25 192 / 0.03) 31px)",
    accent: "linear-gradient(90deg, oklch(0.55 0.25 192 / 0.05) 0%, transparent 50%, oklch(0.55 0.20 192 / 0.04) 100%)",
    ornament: "radial-gradient(ellipse 200px 100px at 50% 60%, oklch(0.55 0.25 192 / 0.05) 0%, transparent 100%)",
    animation: "pulse 5s ease-in-out infinite alternate",
  },

  social: {
    rays: "radial-gradient(ellipse 80% 40% at 50% 10%, oklch(0.60 0.22 290 / 0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 70% at 30% 80%, oklch(0.55 0.25 192 / 0.08) 0%, transparent 70%)",
    aura: "radial-gradient(circle 350px at 50% 40%, oklch(0.60 0.22 290 / 0.06) 0%, transparent 100%)",
    gear: "repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 50px, oklch(0.60 0.22 290 / 0.04) 50px, oklch(0.60 0.22 290 / 0.04) 51px, transparent 51px, transparent 70px, oklch(0.55 0.25 192 / 0.03) 70px, oklch(0.55 0.25 192 / 0.03) 71px)",
    mesh: "repeating-linear-gradient(-30deg, transparent, transparent 80px, oklch(0.60 0.22 290 / 0.02) 80px, oklch(0.60 0.22 290 / 0.02) 81px)",
    accent: "conic-gradient(from 120deg at 50% 50%, transparent 0deg, oklch(0.60 0.22 290 / 0.04) 180deg, transparent 360deg)",
    ornament: "radial-gradient(circle 200px at 70% 30%, oklch(0.60 0.22 290 / 0.05) 0%, transparent 100%)",
  },

  campaigns: {
    rays: "radial-gradient(ellipse 80% 50% at 50% 20%, oklch(0.65 0.22 25 / 0.10) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 50% 80%, oklch(0.55 0.24 278 / 0.08) 0%, transparent 70%)",
    aura: "radial-gradient(circle 450px at 50% 50%, oklch(0.65 0.22 25 / 0.05) 0%, transparent 100%)",
    gear: "repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 100px, oklch(0.65 0.22 25 / 0.03) 100px, oklch(0.65 0.22 25 / 0.03) 101px, transparent 101px, transparent 120px, oklch(0.55 0.24 278 / 0.02) 120px, oklch(0.55 0.24 278 / 0.02) 121px)",
    mesh: "repeating-linear-gradient(0deg, transparent, transparent 90px, oklch(0.65 0.22 25 / 0.02) 90px, oklch(0.65 0.22 25 / 0.02) 91px), repeating-linear-gradient(90deg, transparent, transparent 90px, oklch(0.55 0.24 278 / 0.02) 90px, oklch(0.55 0.24 278 / 0.02) 91px)",
    accent: "conic-gradient(from 60deg at 50% 50%, transparent 0deg, oklch(0.65 0.22 25 / 0.04) 120deg, transparent 240deg, oklch(0.55 0.24 278 / 0.04) 360deg)",
    ornament: "radial-gradient(ellipse 350px 150px at 50% 30%, oklch(0.65 0.22 25 / 0.04) 0%, transparent 100%)",
  },

  omnicore: {
    rays: "radial-gradient(ellipse 80% 60% at 50% 30%, oklch(0.55 0.24 278 / 0.14) 0%, transparent 70%), radial-gradient(ellipse 60% 80% at 50% 70%, oklch(0.72 0.18 192 / 0.10) 0%, transparent 70%)",
    aura: "radial-gradient(circle 500px at 50% 50%, oklch(0.55 0.24 278 / 0.07) 0%, transparent 100%)",
    gear: "repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 60px, oklch(0.55 0.24 278 / 0.05) 60px, oklch(0.55 0.24 278 / 0.05) 61px, transparent 61px, transparent 90px, oklch(0.72 0.18 192 / 0.04) 90px, oklch(0.72 0.18 192 / 0.04) 91px, transparent 91px, transparent 130px, oklch(0.55 0.24 278 / 0.03) 130px, oklch(0.55 0.24 278 / 0.03) 131px)",
    mesh: "repeating-linear-gradient(0deg, transparent, transparent 100px, oklch(0.55 0.24 278 / 0.03) 100px, oklch(0.55 0.24 278 / 0.03) 101px), repeating-linear-gradient(90deg, transparent, transparent 100px, oklch(0.72 0.18 192 / 0.03) 100px, oklch(0.72 0.18 192 / 0.03) 101px)",
    accent: "conic-gradient(from 0deg at 50% 50%, oklch(0.55 0.24 278 / 0.05) 0deg, oklch(0.72 0.18 192 / 0.05) 120deg, oklch(0.55 0.24 278 / 0.05) 240deg, oklch(0.72 0.18 192 / 0.05) 360deg)",
    ornament: "radial-gradient(circle 300px at 50% 50%, oklch(0.55 0.24 278 / 0.05) 0%, transparent 100%)",
    animation: "pulse 10s ease-in-out infinite alternate",
  },

  projects: {
    rays: "radial-gradient(ellipse 60% 40% at 40% 10%, oklch(0.68 0.18 162 / 0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 60% 80%, oklch(0.55 0.20 192 / 0.08) 0%, transparent 70%)",
    aura: "radial-gradient(circle 350px at 50% 40%, oklch(0.68 0.18 162 / 0.06) 0%, transparent 100%)",
    gear: "repeating-linear-gradient(0deg, transparent, transparent 70px, oklch(0.68 0.18 162 / 0.03) 70px, oklch(0.68 0.18 162 / 0.03) 71px), repeating-linear-gradient(90deg, transparent, transparent 70px, oklch(0.55 0.20 192 / 0.03) 70px, oklch(0.55 0.20 192 / 0.03) 71px)",
    mesh: "repeating-linear-gradient(45deg, transparent, transparent 100px, oklch(0.68 0.18 162 / 0.02) 100px, oklch(0.68 0.18 162 / 0.02) 101px)",
    accent: "linear-gradient(135deg, oklch(0.68 0.18 162 / 0.05) 0%, transparent 50%, oklch(0.55 0.20 192 / 0.04) 100%)",
    ornament: "radial-gradient(ellipse 250px 150px at 30% 50%, oklch(0.68 0.18 162 / 0.05) 0%, transparent 100%)",
  },

  settings: {
    rays: "radial-gradient(ellipse 50% 40% at 50% 10%, oklch(0.55 0.24 278 / 0.10) 0%, transparent 70%), radial-gradient(ellipse 40% 50% at 50% 90%, oklch(0.55 0.20 192 / 0.08) 0%, transparent 70%)",
    aura: "radial-gradient(circle 300px at 50% 50%, oklch(0.55 0.24 278 / 0.05) 0%, transparent 100%)",
    gear: "repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 40px, oklch(0.55 0.24 278 / 0.04) 40px, oklch(0.55 0.24 278 / 0.04) 41px, transparent 41px, transparent 55px, oklch(0.55 0.20 192 / 0.03) 55px, oklch(0.55 0.20 192 / 0.03) 56px)",
    mesh: "repeating-linear-gradient(0deg, transparent, transparent 45px, oklch(0.55 0.24 278 / 0.02) 45px, oklch(0.55 0.24 278 / 0.02) 46px), repeating-linear-gradient(90deg, transparent, transparent 45px, oklch(0.55 0.20 192 / 0.02) 45px, oklch(0.55 0.20 192 / 0.02) 46px)",
    accent: "conic-gradient(from 180deg at 50% 50%, transparent 0deg, oklch(0.55 0.24 278 / 0.04) 180deg, transparent 360deg)",
    ornament: "radial-gradient(circle 150px at 50% 50%, oklch(0.55 0.24 278 / 0.04) 0%, transparent 100%)",
  },

  seo: {
    rays: "radial-gradient(ellipse 60% 50% at 50% 0%, oklch(0.72 0.18 192 / 0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 50% 80%, oklch(0.65 0.18 45 / 0.08) 0%, transparent 70%)",
    aura: "radial-gradient(circle 350px at 50% 30%, oklch(0.72 0.18 192 / 0.06) 0%, transparent 100%)",
    gear: "repeating-linear-gradient(60deg, transparent, transparent 50px, oklch(0.72 0.18 192 / 0.03) 50px, oklch(0.72 0.18 192 / 0.03) 51px), repeating-linear-gradient(-30deg, transparent, transparent 50px, oklch(0.65 0.18 45 / 0.02) 50px, oklch(0.65 0.18 45 / 0.02) 51px)",
    mesh: "repeating-linear-gradient(0deg, transparent, transparent 60px, oklch(0.72 0.18 192 / 0.02) 60px, oklch(0.72 0.18 192 / 0.02) 61px)",
    accent: "linear-gradient(180deg, oklch(0.72 0.18 192 / 0.05) 0%, transparent 50%, oklch(0.65 0.18 45 / 0.04) 100%)",
    ornament: "radial-gradient(ellipse 200px 300px at 50% 20%, oklch(0.72 0.18 192 / 0.05) 0%, transparent 100%)",
  },

  cms: {
    rays: "radial-gradient(ellipse 70% 40% at 30% 15%, oklch(0.55 0.20 192 / 0.10) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 70% 75%, oklch(0.68 0.18 162 / 0.08) 0%, transparent 70%)",
    aura: "radial-gradient(circle 350px at 50% 40%, oklch(0.55 0.20 192 / 0.06) 0%, transparent 100%)",
    gear: "repeating-linear-gradient(-15deg, transparent, transparent 55px, oklch(0.55 0.20 192 / 0.03) 55px, oklch(0.55 0.20 192 / 0.03) 56px)",
    mesh: "repeating-linear-gradient(0deg, transparent, transparent 55px, oklch(0.55 0.20 192 / 0.02) 55px, oklch(0.55 0.20 192 / 0.02) 56px), repeating-linear-gradient(90deg, transparent, transparent 55px, oklch(0.68 0.18 162 / 0.02) 55px, oklch(0.68 0.18 162 / 0.02) 56px)",
    accent: "linear-gradient(45deg, oklch(0.55 0.20 192 / 0.04) 0%, transparent 50%, oklch(0.68 0.18 162 / 0.04) 100%)",
    ornament: "radial-gradient(ellipse 200px 150px at 50% 50%, oklch(0.55 0.20 192 / 0.04) 0%, transparent 100%)",
  },

  marketplace: {
    rays: "radial-gradient(ellipse 70% 50% at 50% 15%, oklch(0.65 0.18 45 / 0.10) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 50% 85%, oklch(0.68 0.18 162 / 0.08) 0%, transparent 70%)",
    aura: "radial-gradient(circle 400px at 50% 50%, oklch(0.65 0.18 45 / 0.05) 0%, transparent 100%)",
    gear: "repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 70px, oklch(0.65 0.18 45 / 0.03) 70px, oklch(0.65 0.18 45 / 0.03) 71px, transparent 71px, transparent 110px, oklch(0.68 0.18 162 / 0.02) 110px, oklch(0.68 0.18 162 / 0.02) 111px)",
    mesh: "repeating-linear-gradient(0deg, transparent, transparent 80px, oklch(0.65 0.18 45 / 0.02) 80px, oklch(0.65 0.18 45 / 0.02) 81px), repeating-linear-gradient(90deg, transparent, transparent 80px, oklch(0.68 0.18 162 / 0.02) 80px, oklch(0.68 0.18 162 / 0.02) 81px)",
    accent: "conic-gradient(from 90deg at 50% 50%, transparent 0deg, oklch(0.65 0.18 45 / 0.04) 180deg, transparent 360deg)",
    ornament: "radial-gradient(ellipse 250px 150px at 50% 40%, oklch(0.65 0.18 45 / 0.04) 0%, transparent 100%)",
  },

  affiliate: {
    rays: "radial-gradient(ellipse 60% 50% at 40% 20%, oklch(0.72 0.18 192 / 0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 60% 80%, oklch(0.55 0.24 278 / 0.08) 0%, transparent 70%)",
    aura: "radial-gradient(circle 300px at 50% 50%, oklch(0.72 0.18 192 / 0.06) 0%, transparent 100%)",
    gear: "radial-gradient(circle 1px at 15% 30%, oklch(0.72 0.18 192 / 0.20) 0%, transparent 100%), radial-gradient(circle 1px at 30% 55%, oklch(0.55 0.24 278 / 0.15) 0%, transparent 100%), radial-gradient(circle 1px at 50% 25%, oklch(0.72 0.18 192 / 0.15) 0%, transparent 100%), radial-gradient(circle 1px at 70% 50%, oklch(0.55 0.24 278 / 0.12) 0%, transparent 100%), radial-gradient(circle 1px at 85% 30%, oklch(0.72 0.18 192 / 0.15) 0%, transparent 100%), radial-gradient(circle 1px at 40% 75%, oklch(0.55 0.24 278 / 0.12) 0%, transparent 100%), radial-gradient(circle 1px at 65% 70%, oklch(0.72 0.18 192 / 0.10) 0%, transparent 100%)",
    mesh: "repeating-linear-gradient(0deg, transparent, transparent 50px, oklch(0.72 0.18 192 / 0.03) 50px, oklch(0.72 0.18 192 / 0.03) 51px), repeating-linear-gradient(90deg, transparent, transparent 50px, oklch(0.55 0.24 278 / 0.02) 50px, oklch(0.55 0.24 278 / 0.02) 51px)",
    accent: "conic-gradient(from 0deg at 50% 50%, transparent 0deg, oklch(0.72 0.18 192 / 0.04) 60deg, oklch(0.55 0.24 278 / 0.04) 120deg, transparent 180deg, oklch(0.72 0.18 192 / 0.03) 300deg, transparent 360deg)",
    ornament: "radial-gradient(ellipse 200px 200px at 50% 50%, oklch(0.72 0.18 192 / 0.04) 0%, transparent 100%)",
  },

  default: {
    rays: "radial-gradient(ellipse 60% 40% at 50% 20%, oklch(0.55 0.20 192 / 0.06) 0%, transparent 70%)",
    aura: "radial-gradient(circle 300px at 50% 50%, oklch(0.55 0.20 192 / 0.03) 0%, transparent 100%)",
    gear: "radial-gradient(circle 200px at 50% 50%, transparent 40%, oklch(0.55 0.20 192 / 0.02) 41%, transparent 42%)",
    mesh: "repeat(0)",
    accent: "transparent",
    ornament: "",
  },
};

function detectVariant(path: string): string {
  if (path === "/" || path === "/today") return "hub";
  if (path.startsWith("/kanban") || path.startsWith("/leads") || path.startsWith("/history")) return "leads";
  if (path.startsWith("/hermes") || path.startsWith("/hera") || path.startsWith("/chat-agent") || path.startsWith("/ai") || path.startsWith("/computer-flow") || path.startsWith("/hermio")) return "ai";
  if (path.startsWith("/stats") || path.startsWith("/analytics") || path.startsWith("/roi")) return "analytics";
  if (path.startsWith("/billing") || path.startsWith("/revenue") || path.startsWith("/finance")) return "financial";
  if (path.startsWith("/deals") || path.startsWith("/crm") || path.startsWith("/pipeline") || path.startsWith("/sales")) return "deals";
  if (path.startsWith("/integrations") || path.startsWith("/api-keys")) return "integrations";
  if (path.startsWith("/sequences") || path.startsWith("/automation") || path.startsWith("/autopilot") || path.startsWith("/sdr")) return "automation";
  if (path.startsWith("/social") || path.startsWith("/listening") || path.startsWith("/signal")) return "social";
  if (path.startsWith("/campaign") || path.startsWith("/ads") || path.startsWith("/ad-")) return "campaigns";
  if (path.startsWith("/omnicore") || path.startsWith("/hub")) return "omnicore";
  if (path.startsWith("/project") || path.startsWith("/command-center") || path.startsWith("/command")) return "projects";
  if (path.startsWith("/setting") || path.startsWith("/admin") || path.startsWith("/profile")) return "settings";
  if (path.startsWith("/seo")) return "seo";
  if (path.startsWith("/cms") || path.startsWith("/content") || path.startsWith("/articles") || path.startsWith("/pages")) return "cms";
  if (path.startsWith("/marketplace") || path.startsWith("/catalog") || path.startsWith("/products")) return "marketplace";
  if (path.startsWith("/affiliate") || path.startsWith("/referral")) return "affiliate";
  return "default";
}

export function PageBackground() {
  const [location] = useLocation();
  const variant = VARIANTS[detectVariant(location)] ?? VARIANTS.default;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0"
      style={{ animation: variant.animation ?? "none" }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{ background: variant.rays }}
      />
      <div
        className="absolute inset-0"
        style={{ background: variant.aura }}
      />
      <div
        className="absolute inset-0"
        style={{ background: variant.gear }}
      />
      <div
        className="absolute inset-0"
        style={{ background: variant.mesh }}
      />
      <div
        className="absolute inset-0"
        style={{ background: variant.accent }}
      />
      <div
        className="absolute inset-0"
        style={{ background: variant.ornament }}
      />
    </div>
  );
}
