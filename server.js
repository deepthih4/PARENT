
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

// =====================================================
// STUDENT TABLE CONFIGURATION
// =====================================================

// Set these in Render Environment Variables.
// Use the EXACT column names from your Supabase table.

const STUDENTS_TABLE =
    process.env.STUDENTS_TABLE || "students";

const STUDENT_ID_COLUMN =
    process.env.STUDENT_ID_COLUMN;

const PARENT_MOBILE_COLUMN =
    process.env.PARENT_MOBILE_COLUMN;

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
// Existing route preserved
// =====================================================

app.post("/api/login", async (req, res) => {
    try {
        const loginId = String(
            req.body.loginId || ""
        ).trim();

        const password = String(
            req.body.password || ""
        ).trim();

        if (!loginId || !password) {
            return res.status(400).json({
                success: false,
                message: "Login ID and Password are required."
            });
        }

        const { data, error } = await supabase
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
                message: "Institution login database error."
            });
        }

        if (!data || data.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid Login ID or Password."
            });
        }

        const row = data[0];

        const storedPassword = String(
            row.password || ""
        ).trim();

        if (
            !storedPassword ||
            storedPassword !== password
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid Login ID or Password."
            });
        }

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
// PARENT LOGIN
// Student ID + Parent Mobile Number
// =====================================================

app.post("/api/parent-login", async (req, res) => {
    try {
        const studentId = String(
            req.body.studentId || ""
        ).trim();

        const parentMobile = String(
            req.body.parentMobile || ""
        ).trim();

        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (!studentId || !parentMobile) {
            return res.status(400).json({
                success: false,
                message:
                    "Student ID and Parent Mobile Number are required."
            });
        }

        if (!/^[0-9]{10}$/.test(parentMobile)) {
            return res.status(400).json({
                success: false,
                message:
                    "Enter a valid 10-digit Parent Mobile Number."
            });
        }

        // ---------------------------------------------
        // CHECK CONFIGURATION
        // ---------------------------------------------

        if (
            !STUDENT_ID_COLUMN ||
            !PARENT_MOBILE_COLUMN
        ) {
            console.error(
                "Missing STUDENT_ID_COLUMN or PARENT_MOBILE_COLUMN"
            );

            return res.status(500).json({
                success: false,
                message:
                    "Student login is not configured on the server."
            });
        }

        // ---------------------------------------------
        // VERIFY STUDENT
        // ---------------------------------------------

        const { data, error } = await supabase
            .from(STUDENTS_TABLE)
            .select("*")
            .eq(STUDENT_ID_COLUMN, studentId)
            .eq(PARENT_MOBILE_COLUMN, parentMobile)
            .limit(1);

        if (error) {
            console.error(
                "PARENT LOGIN DB ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to verify student details."
            });
        }

        if (!data || data.length === 0) {
            return res.status(401).json({
                success: false,
                message:
                    "Student ID or Parent Mobile Number is incorrect."
            });
        }

        const student = data[0];

        // Do not send institution-wide data here.
        // Remove sensitive fields before responding.
        const {
            password,
            login_password,
            ...safeStudent
        } = student;

        return res.json({
            success: true,
            message: "Login successful.",
            student: safeStudent
        });

    } catch (error) {
        console.error(
            "PARENT LOGIN SERVER ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Parent login failed. Please try again."
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
// INSTITUTION DASHBOARD
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

app.use(express.static(__dirname));

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
