
const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();

const PORT = process.env.PORT || 10000;

// =====================================================
// SUPABASE CONNECTION
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
// STUDENT TABLE SETTINGS
// =====================================================

// Supabase table name
const STUDENTS_TABLE = "students";

// Supabase Student ID column
const STUDENT_ID_COLUMN = "student_id";

// Supabase Parent Mobile column
const PARENT_MOBILE_COLUMN = "parent_mobile";

// =====================================================
// HEALTH CHECK
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

        // VALIDATION

        if (!loginId || !password) {

            return res.status(400).json({
                success: false,
                message: "Login ID and Password are required."
            });

        }

        // FIND INSTITUTION

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

        // LOGIN ID NOT FOUND

        if (!data || data.length === 0) {

            return res.status(401).json({
                success: false,
                message: "Invalid Login ID or Password."
            });

        }

        const row = data[0];

        // PASSWORD CHECK

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

        // SUCCESS

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

        // VALIDATION

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

        // FIND MATCHING STUDENT

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

        // STUDENT NOT FOUND

        if (!data || data.length === 0) {

            return res.status(401).json({
                success: false,
                message:
                    "Student ID or Parent Mobile Number is incorrect."
            });

        }

        const student = data[0];

        // DO NOT SEND PASSWORD FIELDS

        const {
            password,
            login_password,
            ...safeStudent
        } = student;

        // SUCCESS

        return res.json({
            success: true,
            message: "Parent login successful.",
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
