import type { PricingRule } from '@/types/database';

export type PropertyType = 'apartment' | 'house' | 'office';

export interface PricingInput {
  startingPrice: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  rules: PricingRule[];
}

export function calculateEstimateFromRules(input: PricingInput): number {
  const { startingPrice, propertyType, bedrooms, bathrooms, rules } = input;

  const activeRules = rules.filter((r) => r.is_active);

  const getRule = (key: string): PricingRule | null => {
    const serviceSpecific = activeRules.find((r) => r.rule_key === key && r.service_id !== null);
    if (serviceSpecific) return serviceSpecific;
    const global = activeRules.find((r) => r.rule_key === key && r.service_id === null);
    return global ?? null;
  };

  let estimate = Number(startingPrice);

  const bedroomRule = getRule('bedroom_extra');
  if (bedroomRule && bedroomRule.modifier_type === 'additive') {
    estimate += Math.max(0, bedrooms) * Number(bedroomRule.price_modifier);
  }

  const bathroomRule = getRule('bathroom_extra');
  if (bathroomRule && bathroomRule.modifier_type === 'additive') {
    estimate += Math.max(0, bathrooms) * Number(bathroomRule.price_modifier);
  }

  const houseRule = getRule('house_multiplier');
  if (houseRule && houseRule.modifier_type === 'multiplier' && propertyType === 'house') {
    estimate = estimate * Number(houseRule.price_modifier);
  }

  return Math.round(estimate);
}
