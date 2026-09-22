const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();

const PORT = process.env.PORT || 10000;

// =====================================================
// SUPABASE
// =====================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
        "Missing SUPABASE_URL or SUPABASE_ANON_KEY in Render Environment"
    );
}

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// HEALTH
// =====================================================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Cezonal Institution Access Server Running"
    });
});

// =====================================================
// INSTITUTION LOGIN
// Login ID + Password
// =====================================================

app.post("/api/login", async (req, res) => {

    try {

        const loginId = String(
            req.body.loginId || ""
        ).trim();

        const password = String(
            req.body.password || ""
        ).trim();

        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!loginId || !password) {

            return res.status(400).json({
                success: false,
                message: "Login ID and Password are required."
            });

        }

        console.log(
            "Institution login attempt:",
            loginId
        );

        // =================================================
        // FIND INSTITUTION
        // =================================================

        const {
            data,
            error
        } = await supabase
            .from("institutions")
            .select("*")
            .eq("login_id", loginId)
            .limit(1);

        if (error) {

            console.error(
                "INSTITUTION LOGIN DB ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: error.message
            });

        }

        // -------------------------------------------------
        // LOGIN ID NOT FOUND
        // -------------------------------------------------

        if (!data || data.length === 0) {

            return res.status(401).json({
                success: false,
                message: "Invalid Login ID or Password."
            });

        }

        const row = data[0];

        // =================================================
        // PASSWORD CHECK
        // =================================================

        const storedPassword = String(
            row.password || ""
        ).trim();

        if (!storedPassword || storedPassword !== password) {

            return res.status(401).json({
                success: false,
                message: "Invalid Login ID or Password."
            });

        }

        // =================================================
        // SUCCESS
        // =================================================

        console.log(
            "Institution login successful:",
            loginId
        );

        return res.json({
            success: true,

            institution: row
        });

    } catch (error) {

        console.error(
            "INSTITUTION LOGIN SERVER ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Login failed. Please try again."
        });

    }

});

// =====================================================
// LOGOUT
// =====================================================

app.post("/api/logout", (req, res) => {

    res.json({
        success: true,
        message: "Logged out successfully"
    });

});

// =====================================================
// SERVE HTML
// =====================================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "institution-access.html"
        )
    );

});

// =====================================================
// STATIC FILES
// =====================================================

app.use(
    express.static(__dirname)
);

// =====================================================
// START SERVER
// =====================================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Cezonal Institution Access running on port ${PORT}`
        );

    }
);
