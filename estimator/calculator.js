/**
 * Calculator module for diving services cost calculations
 * Handles all pricing logic and surcharge calculations
 */

import { serviceData, minimumCharge, anodeInstallationRate, paintConditions, growthLevels, surcharges } from './configuration.js';

/**
 * Determines paint condition based on time since last painting
 */
export function getPaintCondition(lastPaintedValue) {
    switch (lastPaintedValue) {
        case '0-6_months':
            return paintConditions.EXCELLENT;
        case '7-12_months':
            return paintConditions.GOOD;
        case '13-21_months':
            return paintConditions.FAIR;
        case '22-24_months':
        case 'over_24_months':
        case 'unsure_paint':
            return paintConditions.POOR;
        default:
            return paintConditions.POOR;
    }
}

/**
 * Determines growth level based on paint condition and last cleaned time
 */
export function getGrowthLevel(paintCondition, lastCleanedValue) {
    switch (paintCondition) {
        case paintConditions.EXCELLENT:
            if (lastCleanedValue === '0-2_months') return growthLevels.MINIMAL;
            if (lastCleanedValue === '3-4_months') return growthLevels.MODERATE;
            if (lastCleanedValue === '5-6_months' || lastCleanedValue === '7-8_months') return growthLevels.HEAVY;
            return growthLevels.SEVERE;

        case paintConditions.GOOD:
            if (lastCleanedValue === '0-2_months') return growthLevels.MINIMAL;
            if (lastCleanedValue === '3-4_months') return growthLevels.MODERATE;
            if (lastCleanedValue === '5-6_months' || lastCleanedValue === '7-8_months') return growthLevels.HEAVY;
            return growthLevels.SEVERE;

        case paintConditions.FAIR:
            if (lastCleanedValue === '0-2_months') return growthLevels.MODERATE;
            if (lastCleanedValue === '3-4_months' || lastCleanedValue === '5-6_months') return growthLevels.HEAVY;
            return growthLevels.SEVERE;

        case paintConditions.POOR:
            if (lastCleanedValue === '0-2_months' || lastCleanedValue === '3-4_months') return growthLevels.HEAVY;
            return growthLevels.SEVERE;

        default:
            return growthLevels.SEVERE;
    }
}

/**
 * Calculates paint surcharge percentage based on condition
 */
export function getPaintSurcharge(paintCondition, lastPaintedValue = null) {
    // For direct condition mode (admin page)
    if (!lastPaintedValue) {
        switch(paintCondition) {
            case paintConditions.EXCELLENT:
            case paintConditions.GOOD:
            case paintConditions.FAIR:
                return 0;
            case paintConditions.POOR:
                return surcharges.paintPoor;
            case paintConditions.MISSING:
                return surcharges.paintMissing;
            default:
                return 0;
        }
    }

    // For time-based estimation
    if (paintCondition !== paintConditions.POOR) {
        return 0;
    }

    switch (lastPaintedValue) {
        case '22-24_months':
            return 0.05; // 5% for "Poor (Low)"
        case 'over_24_months':
        case 'unsure_paint':
            return 0.15; // 15% for "Poor (High/Missing)"
        default:
            return 0;
    }
}

/**
 * Calculates growth surcharge percentage based on level
 */
export function getGrowthSurcharge(growthLevel, paintCondition = null, lastCleanedValue = null) {
    // For direct condition mode (admin page)
    if (!paintCondition && !lastCleanedValue) {
        switch(growthLevel) {
            case growthLevels.MINIMAL:
            case growthLevels.MODERATE:
                return 0;
            case growthLevels.HEAVY:
                return surcharges.growthHeavy;
            case growthLevels.SEVERE:
                return surcharges.growthSevere;
            default:
                return 0;
        }
    }

    // For time-based estimation - detailed percentage based on paint and time
    if (!paintCondition || !lastCleanedValue) return 0;

    switch (paintCondition) {
        case paintConditions.EXCELLENT:
            if (lastCleanedValue === '0-2_months' || lastCleanedValue === '3-4_months') return 0;
            if (lastCleanedValue === '5-6_months') return 0.25;
            if (lastCleanedValue === '7-8_months') return 0.40;
            if (lastCleanedValue === '9-12_months') return 0.70;
            if (lastCleanedValue === '13-24_months') return 0.85;
            if (lastCleanedValue === 'over_24_months_unsure') return 1.00;
            break;

        case paintConditions.GOOD:
            if (lastCleanedValue === '0-2_months' || lastCleanedValue === '3-4_months') return 0;
            if (lastCleanedValue === '5-6_months') return 0.25;
            if (lastCleanedValue === '7-8_months') return 0.40;
            if (lastCleanedValue === '9-12_months') return 0.75;
            if (lastCleanedValue === '13-24_months') return 0.90;
            if (lastCleanedValue === 'over_24_months_unsure') return 1.00;
            break;

        case paintConditions.FAIR:
            if (lastCleanedValue === '0-2_months') return 0;
            if (lastCleanedValue === '3-4_months') return 0.25;
            if (lastCleanedValue === '5-6_months') return 0.40;
            if (lastCleanedValue === '7-8_months') return 0.70;
            if (lastCleanedValue === '9-12_months') return 0.85;
            if (lastCleanedValue === '13-24_months') return 0.95;
            if (lastCleanedValue === 'over_24_months_unsure') return 1.00;
            break;

        case paintConditions.POOR:
            if (lastCleanedValue === '0-2_months') return 0.30;
            if (lastCleanedValue === '3-4_months') return 0.50;
            if (lastCleanedValue === '5-6_months') return 0.80;
            if (lastCleanedValue === '7-8_months') return 0.90;
            if (lastCleanedValue === '9-12_months') return 0.95;
            if (lastCleanedValue === '13-24_months' || lastCleanedValue === 'over_24_months_unsure') return 1.00;
            break;
    }

    return 1.00; // Default fallback
}

/**
 * Main cost calculation function
 */
export function calculateServiceCost(params) {
    const {
        serviceKey,
        boatLength = 0,
        boatType = 'sailboat',
        hullType = 'monohull',
        hasTwinEngines = false,
        lastPaintedTime = null,
        lastCleanedTime = null,
        anodesToInstall = 0,
        actualPaintCondition = null,
        actualGrowthLevel = null
    } = params;

    if (!serviceKey || !serviceData[serviceKey]) {
        return {
            success: false,
            error: 'Invalid service selected',
            total: 0,
            breakdown: {}
        };
    }

    const service = serviceData[serviceKey];
    const result = {
        success: true,
        service: service.name,
        serviceType: service.type,
        baseRate: service.rate,
        breakdown: {
            items: [],
            subtotal: 0,
            total: 0,
            minimumApplied: false
        }
    };

    let baseServiceCost = 0;
    let surchargeTotal = 0;

    // Calculate base cost
    if (service.type === 'per_foot') {
        if (boatLength <= 0) {
            return {
                success: false,
                error: 'Invalid boat length for per-foot service',
                total: 0,
                breakdown: {}
            };
        }

        baseServiceCost = service.rate * boatLength;
        result.breakdown.items.push({
            type: 'base',
            description: `Base (${service.rate.toFixed(2)}/ft × ${boatLength}ft)`,
            amount: baseServiceCost
        });

        // Calculate boat type surcharges
        const isPowerboat = boatType === 'powerboat';
        if (isPowerboat) {
            const surcharge = baseServiceCost * surcharges.powerboat;
            surchargeTotal += surcharge;
            result.breakdown.items.push({
                type: 'surcharge',
                description: 'Powerboat Surcharge (+25%)',
                amount: surcharge
            });
        }

        // Hull type surcharges
        if (hullType === 'catamaran') {
            const surcharge = baseServiceCost * surcharges.catamaran;
            surchargeTotal += surcharge;
            result.breakdown.items.push({
                type: 'surcharge',
                description: 'Catamaran Surcharge (+25%)',
                amount: surcharge
            });
        } else if (hullType === 'trimaran') {
            const surcharge = baseServiceCost * surcharges.trimaran;
            surchargeTotal += surcharge;
            result.breakdown.items.push({
                type: 'surcharge',
                description: 'Trimaran Surcharge (+50%)',
                amount: surcharge
            });
        }

        // Twin engines surcharge
        if (hasTwinEngines) {
            const surcharge = baseServiceCost * surcharges.twinEngines;
            surchargeTotal += surcharge;
            result.breakdown.items.push({
                type: 'surcharge',
                description: 'Twin Engine Surcharge (+10%)',
                amount: surcharge
            });
        }

        // Paint and growth surcharges (only for cleaning services)
        const isCleaningService = serviceKey === 'onetime_cleaning' || serviceKey === 'recurring_cleaning';
        if (isCleaningService) {
            let paintCondition, growthLevel, paintSurcharge, growthSurcharge;

            // Determine conditions and surcharges
            if (actualPaintCondition && actualGrowthLevel) {
                // Direct condition mode (admin page)
                paintCondition = actualPaintCondition;
                growthLevel = actualGrowthLevel;
                paintSurcharge = getPaintSurcharge(paintCondition);
                growthSurcharge = getGrowthSurcharge(growthLevel);
            } else {
                // Time-based estimation mode
                paintCondition = getPaintCondition(lastPaintedTime);
                growthLevel = getGrowthLevel(paintCondition, lastCleanedTime);
                paintSurcharge = getPaintSurcharge(paintCondition, lastPaintedTime);
                growthSurcharge = getGrowthSurcharge(growthLevel, paintCondition, lastCleanedTime);
            }

            if (paintSurcharge > 0) {
                const amount = baseServiceCost * paintSurcharge;
                surchargeTotal += amount;
                result.breakdown.items.push({
                    type: 'surcharge',
                    description: `${actualPaintCondition ? '' : 'Est. '}Paint (${paintCondition}): +${(paintSurcharge * 100).toFixed(0)}%`,
                    amount: amount
                });
            }

            if (growthSurcharge > 0) {
                const amount = baseServiceCost * growthSurcharge;
                surchargeTotal += amount;
                result.breakdown.items.push({
                    type: 'surcharge',
                    description: `${actualGrowthLevel ? '' : 'Est. '}Growth (${growthLevel}): +${(growthSurcharge * 100).toFixed(0)}%`,
                    amount: amount
                });
            }
        }

    } else {
        // Flat rate service
        baseServiceCost = service.rate;
        result.breakdown.items.push({
            type: 'base',
            description: 'Flat Rate',
            amount: baseServiceCost
        });
    }

    // Add anode installation cost
    let anodeInstallationCost = 0;
    if (anodesToInstall > 0) {
        anodeInstallationCost = anodesToInstall * anodeInstallationRate;
        result.breakdown.items.push({
            type: 'additional',
            description: `Anode Installation (${anodesToInstall} @ $${anodeInstallationRate} each)`,
            amount: anodeInstallationCost
        });
    }

    // Calculate totals
    const subtotal = baseServiceCost + surchargeTotal + anodeInstallationCost;
    result.breakdown.subtotal = subtotal;

    // Apply minimum charge if needed
    if (subtotal > 0 && subtotal < minimumCharge) {
        result.breakdown.total = minimumCharge;
        result.breakdown.minimumApplied = true;
    } else {
        result.breakdown.total = subtotal;
    }

    result.total = result.breakdown.total;

    return result;
}

/**
 * Formats the cost breakdown for display
 */
export function formatBreakdown(breakdown, isEstimate = true) {
    const lines = [];

    // Add individual line items
    breakdown.items.forEach(item => {
        if (item.type === 'base') {
            lines.push(`• ${item.description}: $${item.amount.toFixed(2)}`);
        } else if (item.type === 'surcharge') {
            lines.push(`  • ${item.description}: $${item.amount.toFixed(2)}`);
        } else {
            lines.push(`• ${item.description}: $${item.amount.toFixed(2)}`);
        }
    });

    // Add subtotal
    lines.push(`Subtotal: $${breakdown.subtotal.toFixed(2)}`);

    // Add minimum charge notice if applied
    if (breakdown.minimumApplied) {
        lines.push(`Applied Minimum Charge: $${minimumCharge.toFixed(2)}`);
    }

    // Add total
    const totalLabel = isEstimate ? 'Total Estimate' : 'Total';
    lines.push(`${totalLabel}: $${breakdown.total.toFixed(2)}`);

    return lines.join('\n');
}