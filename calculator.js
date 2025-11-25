/**
 * Professional Trading Calculator
 * Funding Trading Position Sizing & Risk Management
 */

class TradingCalculator {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    /**
     * A. Calculate max position size based on leverage
     * maxPositionSize = (accountSize * leverage) / entryPrice
     */
    calculateMaxPositionSize(accountSize, leverage, entryPrice) {
        return (accountSize * leverage) / entryPrice;
    }

    /**
     * B. Calculate position size based on risk
     * Used when user gives riskUSD and stopLossPrice
     * slDistance = |entryPrice - stopLossPrice|
     * positionSize = riskUSD / slDistance
     */
    calculatePositionSizeFromRisk(riskUSD, entryPrice, stopLossPrice) {
        const slDistance = Math.abs(entryPrice - stopLossPrice);
        if (slDistance === 0) {
            throw new Error('Stop Loss Price cannot equal Entry Price');
        }
        return riskUSD / slDistance;
    }

    /**
     * C. Calculate Take Profit Price based on target profit
     * Used when user gives targetProfitUSD
     * tpDistance = targetProfitUSD / positionSize
     * takeProfitPrice = entryPrice + tpDistance (long)
     * takeProfitPrice = entryPrice - tpDistance (short)
     */
    calculateTakeProfitPrice(entryPrice, targetProfitUSD, positionSize, positionType) {
        if (positionSize === 0) {
            throw new Error('Position Size cannot be zero');
        }
        const tpDistance = targetProfitUSD / positionSize;
        
        if (positionType === 'long') {
            return entryPrice + tpDistance;
        } else {
            return entryPrice - tpDistance;
        }
    }

    /**
     * D. Calculate Stop Loss Price based on risk
     * Used when user gives riskUSD but no SL price
     * slDistance = riskUSD / positionSize
     * stopLossPrice = entryPrice - slDistance (long)
     * stopLossPrice = entryPrice + slDistance (short)
     */
    calculateStopLossPrice(entryPrice, riskUSD, positionSize, positionType) {
        if (positionSize === 0) {
            throw new Error('Position Size cannot be zero');
        }
        const slDistance = riskUSD / positionSize;
        
        if (positionType === 'long') {
            return entryPrice - slDistance;
        } else {
            return entryPrice + slDistance;
        }
    }

    /**
     * Calculate Liquidation Price
     * Long: liquidationPrice = entryPrice - (entryPrice / leverage)
     * Short: liquidationPrice = entryPrice + (entryPrice / leverage)
     */
    calculateLiquidationPrice(entryPrice, leverage, positionType) {
        const liquidationDistance = entryPrice / leverage;
        
        if (positionType === 'long') {
            return entryPrice - liquidationDistance;
        } else {
            return entryPrice + liquidationDistance;
        }
    }

    /**
     * Calculate risk and profit amounts
     */
    calculateRiskProfit(entryPrice, stopLossPrice, takeProfitPrice, positionSize) {
        const riskAmount = Math.abs((entryPrice - stopLossPrice) * positionSize);
        const profitAmount = Math.abs((takeProfitPrice - entryPrice) * positionSize);
        return { riskAmount, profitAmount };
    }

    /**
     * Validate all inputs
     */
    validate(inputs) {
        this.errors = [];
        this.warnings = [];

        const { accountSize, leverage, entryPrice, stopLossPrice, riskUSD, 
                takeProfitPrice, targetProfitUSD, positionSize } = inputs;

        // Check required fields
        if (!accountSize || accountSize <= 0) {
            this.errors.push('Account Size must be positive');
        }
        if (!leverage || leverage <= 0) {
            this.errors.push('Leverage must be positive');
        }
        if (!entryPrice || entryPrice <= 0) {
            this.errors.push('Entry Price must be positive');
        }

        if (this.errors.length > 0) {
            return false;
        }

        // Check for conflicts
        if (stopLossPrice && stopLossPrice === entryPrice) {
            this.errors.push('Stop Loss Price cannot equal Entry Price');
        }
        if (takeProfitPrice && takeProfitPrice === entryPrice) {
            this.errors.push('Take Profit Price cannot equal Entry Price');
        }

        return true;
    }
}

const calculator = new TradingCalculator();

function calculate() {
    // Get all inputs
    const accountSizeEl = document.getElementById('accountSize');
    const leverageEl = document.getElementById('leverage');
    const entryPriceEl = document.getElementById('entryPrice');
    const stopLossPriceEl = document.getElementById('stopLossPrice');
    const riskUSDEl = document.getElementById('riskUSD');
    const takeProfitPriceEl = document.getElementById('takeProfitPrice');
    const targetProfitUSDEl = document.getElementById('targetProfitUSD');
    const positionSizeEl = document.getElementById('positionSize');
    
    // Check if elements exist
    if (!accountSizeEl || !leverageEl || !entryPriceEl) {
        console.error('Required form elements not found');
        return;
    }
    
    const accountSize = parseFloat(accountSizeEl.value);
    const leverage = parseFloat(leverageEl.value);
    const entryPrice = parseFloat(entryPriceEl.value);
    const stopLossPrice = stopLossPriceEl.value ? parseFloat(stopLossPriceEl.value) : null;
    const riskUSD = riskUSDEl.value ? parseFloat(riskUSDEl.value) : null;
    const takeProfitPrice = takeProfitPriceEl.value ? parseFloat(takeProfitPriceEl.value) : null;
    const targetProfitUSD = targetProfitUSDEl.value ? parseFloat(targetProfitUSDEl.value) : null;
    let positionSize = positionSizeEl.value ? parseFloat(positionSizeEl.value) : null;
    
    const positionTypeRadios = document.querySelectorAll('input[name="positionType"]');
    if (positionTypeRadios.length === 0) {
        console.error('Position type radios not found');
        return;
    }
    const positionType = document.querySelector('input[name="positionType"]:checked').value;

    // Validate inputs
    if (!calculator.validate({ accountSize, leverage, entryPrice, stopLossPrice, riskUSD, takeProfitPrice, targetProfitUSD, positionSize })) {
        displayErrors(calculator.errors);
        return;
    }

    try {
        // Calculate max position size (for validation)
        const maxPositionSize = calculator.calculateMaxPositionSize(accountSize, leverage, entryPrice);

        // Determine position size
        if (!positionSize) {
            if (riskUSD && stopLossPrice) {
                // Calculate from risk and stop loss
                positionSize = calculator.calculatePositionSizeFromRisk(riskUSD, entryPrice, stopLossPrice);
            } else {
                // Use max position size as default
                positionSize = maxPositionSize;
            }
        }

        // Calculate stop loss if not provided
        let finalStopLossPrice = stopLossPrice;
        if (!finalStopLossPrice && riskUSD && positionSize) {
            finalStopLossPrice = calculator.calculateStopLossPrice(entryPrice, riskUSD, positionSize, positionType);
        } else if (!finalStopLossPrice) {
            // Default 5% below entry for long, above for short
            if (positionType === 'long') {
                finalStopLossPrice = entryPrice * 0.95;
            } else {
                finalStopLossPrice = entryPrice * 1.05;
            }
        }

        // Calculate take profit if not provided
        let finalTakeProfitPrice = takeProfitPrice;
        if (!finalTakeProfitPrice && targetProfitUSD && positionSize) {
            finalTakeProfitPrice = calculator.calculateTakeProfitPrice(entryPrice, targetProfitUSD, positionSize, positionType);
        } else if (!finalTakeProfitPrice) {
            // Default 5% above entry for long, below for short
            if (positionType === 'long') {
                finalTakeProfitPrice = entryPrice * 1.05;
            } else {
                finalTakeProfitPrice = entryPrice * 0.95;
            }
        }

        // Calculate all metrics
        const positionValue = entryPrice * positionSize;
        const requiredMargin = positionValue / leverage;
        const liquidationPrice = calculator.calculateLiquidationPrice(entryPrice, leverage, positionType);
        const { riskAmount, profitAmount } = calculator.calculateRiskProfit(entryPrice, finalStopLossPrice, finalTakeProfitPrice, positionSize);
        const riskRewardRatio = riskAmount > 0 ? (profitAmount / riskAmount).toFixed(2) : 0;

        // Display results
        displayResults({
            positionSize,
            positionValue,
            requiredMargin,
            maxPositionSize,
            entryPrice,
            stopLossPrice: finalStopLossPrice,
            takeProfitPrice: finalTakeProfitPrice,
            riskAmount,
            profitAmount,
            riskRewardRatio,
            liquidationPrice,
            leverage
        });

        // Display warnings if any
        if (calculator.warnings.length > 0) {
            displayWarnings(calculator.warnings);
        } else {
            clearWarnings();
        }

        clearErrors();

    } catch (error) {
        calculator.errors.push(error.message);
        displayErrors(calculator.errors);
    }
}

function displayResults(results) {
    try {
        document.getElementById('outPositionSize').textContent = results.positionSize.toFixed(4);
        document.getElementById('outPositionValue').textContent = '$' + results.positionValue.toFixed(2);
        document.getElementById('outRequiredMargin').textContent = '$' + results.requiredMargin.toFixed(2);
        document.getElementById('outMaxPositionSize').textContent = results.maxPositionSize.toFixed(4);
        document.getElementById('outEntryPrice').textContent = '$' + results.entryPrice.toFixed(2);
        document.getElementById('outStopLossPrice').textContent = '$' + results.stopLossPrice.toFixed(2);
        document.getElementById('outTakeProfitPrice').textContent = '$' + results.takeProfitPrice.toFixed(2);
        document.getElementById('outRiskAmount').textContent = '$' + results.riskAmount.toFixed(2);
        document.getElementById('outProfitAmount').textContent = '$' + results.profitAmount.toFixed(2);
        document.getElementById('outRiskRewardRatio').textContent = results.riskRewardRatio + ' : 1';
        document.getElementById('outLiquidationPrice').textContent = '$' + results.liquidationPrice.toFixed(2);
    } catch (e) {
        console.error('Error displaying results:', e);
    }
}

function displayErrors(errors) {
    try {
        const errorBox = document.getElementById('errorBox');
        if (errorBox) {
            errorBox.innerHTML = errors.map(err => '❌ ' + err).join('<br>');
            errorBox.classList.add('show');
        }
    } catch (e) {
        console.error('Error displaying errors:', e);
    }
}

function clearErrors() {
    try {
        const errorBox = document.getElementById('errorBox');
        if (errorBox) {
            errorBox.classList.remove('show');
            errorBox.innerHTML = '';
        }
    } catch (e) {
        console.error('Error clearing errors:', e);
    }
}

function displayWarnings(warnings) {
    try {
        const warningBox = document.getElementById('warningBox');
        if (warningBox) {
            warningBox.innerHTML = warnings.map(warn => '⚠️ ' + warn).join('<br>');
            warningBox.classList.add('show');
        }
    } catch (e) {
        console.error('Error displaying warnings:', e);
    }
}

function clearWarnings() {
    try {
        const warningBox = document.getElementById('warningBox');
        if (warningBox) {
            warningBox.classList.remove('show');
            warningBox.innerHTML = '';
        }
    } catch (e) {
        console.error('Error clearing warnings:', e);
    }
}

function resetForm() {
    try {
        document.getElementById('accountSize').value = '10000';
        document.getElementById('leverage').value = '10';
        document.getElementById('entryPrice').value = '50000';
        document.getElementById('stopLossPrice').value = '';
        document.getElementById('riskUSD').value = '';
        document.getElementById('takeProfitPrice').value = '';
        document.getElementById('targetProfitUSD').value = '';
        document.getElementById('positionSize').value = '';
        
        // Reset outputs
        document.getElementById('outPositionSize').textContent = '0.0000';
        document.getElementById('outPositionValue').textContent = '$0.00';
        document.getElementById('outRequiredMargin').textContent = '$0.00';
        document.getElementById('outMaxPositionSize').textContent = '0.0000';
        document.getElementById('outEntryPrice').textContent = '$0.00';
        document.getElementById('outStopLossPrice').textContent = '-';
        document.getElementById('outTakeProfitPrice').textContent = '-';
        document.getElementById('outRiskAmount').textContent = '$0.00';
        document.getElementById('outProfitAmount').textContent = '$0.00';
        document.getElementById('outRiskRewardRatio').textContent = '0.00 : 1';
        document.getElementById('outLiquidationPrice').textContent = '-';
        
        clearErrors();
        clearWarnings();
    } catch (e) {
        console.error('Error resetting form:', e);
    }
}

// Allow Enter key to calculate
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - calculator ready');
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                calculate();
            }
        });
    });
});
