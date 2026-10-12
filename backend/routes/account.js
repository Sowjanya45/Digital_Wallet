// backend/routes/account.js
const express = require('express');
const { authMiddleware, asyncHandler } = require('../middleware');
const { Account } = require('../db');
const mongoose = require('mongoose');

const router = express.Router();

router.get("/balance", authMiddleware, asyncHandler(async (req, res) => {
    const account = await Account.findOne({
        userId: req.userId
    });

    if (!account) {
        return res.status(404).json({
            message: "Account not found"
        });
    }

    res.json({
        balance: account.balance
    })
}));

router.post("/transfer", authMiddleware, asyncHandler(async (req, res) => {
    const amount = Number(req.body.amount);
    const { to } = req.body;

    if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({
            message: "Invalid amount"
        });
    }

    if (!mongoose.isValidObjectId(to)) {
        return res.status(400).json({
            message: "Invalid account"
        });
    }

    if (String(to) === String(req.userId)) {
        return res.status(400).json({
            message: "Cannot transfer to yourself"
        });
    }

    const session = await mongoose.startSession();

    try {
        let error = null;

        await session.withTransaction(async () => {
            error = null;

            // Fetch the accounts within the transaction
            const account = await Account.findOne({ userId: req.userId }).session(session);

            if (!account || account.balance < amount) {
                error = "Insufficient balance";
                return await session.abortTransaction();
            }

            const toAccount = await Account.findOne({ userId: to }).session(session);

            if (!toAccount) {
                error = "Invalid account";
                return await session.abortTransaction();
            }

            // Perform the transfer
            await Account.updateOne({ userId: req.userId }, { $inc: { balance: -amount } }).session(session);
            await Account.updateOne({ userId: to }, { $inc: { balance: amount } }).session(session);
        });

        if (error) {
            return res.status(400).json({ message: error });
        }

        res.json({
            message: "Transfer successful"
        });
    } finally {
        await session.endSession();
    }
}));

module.exports = router;
