// components/CreditInput.js
import React, { useState } from 'react';
import styles from './CreditInput.module.css'; // Create CreditInput.module.css

const CreditInput = ({ onUpdateCredits, onClose }) => {
    const [creditAmount, setCreditAmount] = useState('');

    const handleInputChange = (e) => {
        const value = e.target.value;
        if (/^\d*\.?\d*$/.test(value)) { // Only allow numbers
            setCreditAmount(value);
        }
    };

    const handleUpdate = () => {
        const amount = parseFloat(creditAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid credit amount.');
            return;
        }
        onUpdateCredits(amount);
        onClose(); // Close the input after updating
    };

    return (
        <div className={styles.creditInputContainer}>
            <label htmlFor="creditAmount" className={styles.creditLabel}>Enter Credit Amount:</label>
            <input
                type="text"
                id="creditAmount"
                className={styles.creditInput}
                placeholder="Enter amount"
                value={creditAmount}
                onChange={handleInputChange}
            />
            <div className={styles.buttonContainer}>
              <button className={styles.updateButton} onClick={handleUpdate}>Update Credits</button>
              <button className={styles.cancelButton} onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};

export default CreditInput;