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
        message: "Cezonal Parent Portal Server Running"
    });
});

// =====================================================
// PARENT LOGIN
// Parent Mobile + Admission Number
// =====================================================

app.post("/api/login", async (req, res) => {

    try {

        const parentMobile = String(
            req.body.parentMobile ||
            req.body.mobile ||
            ""
        ).replace(/\D/g, "");

        const admission = String(
            req.body.admission ||
            req.body.admissionNumber ||
            req.body.studentId ||
            ""
        ).trim().toUpperCase();

        if (!parentMobile || !admission) {

            return res.status(400).json({
                success: false,
                message:
                    "Parent Mobile and Admission Number are required."
            });

        }

        console.log(
            "Parent login:",
            parentMobile,
            admission
        );

        // =================================================
        // FIND STUDENT
        // =================================================

        const {
            data: students,
            error: studentError
        } = await supabase
            .from("students")
            .select("*")
            .eq("student_id", admission)
            .eq("parent_mobile", parentMobile)
            .limit(1);

        if (studentError) {

            console.error(
                "STUDENT LOGIN ERROR:",
                studentError
            );

            return res.status(500).json({
                success: false,
                message: studentError.message
            });
        }

        if (!students || students.length === 0) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid Parent Mobile or Admission Number."
            });
        }

        const student = students[0];

        // =================================================
        // LOAD INSTITUTION
        // =================================================

        let institution = null;

        if (
            student.institution_id !== null &&
            student.institution_id !== undefined &&
            student.institution_id !== ""
        ) {

            const {
                data: institutionData,
                error: institutionError
            } = await supabase
                .from("institutions")
                .select("*")
                .eq("id", student.institution_id)
                .maybeSingle();

            if (institutionError) {

                console.warn(
                    "Institution load warning:",
                    institutionError.message
                );

            } else {

                institution = institutionData || null;

            }
        }

        // =================================================
        // SUCCESS
        // =================================================

        return res.json({
            success: true,

            student: student,

            institution: institution
        });

    } catch (error) {

        console.error(
            "PARENT LOGIN SERVER ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Parent login failed."
        });
    }
});

// =====================================================
// SERVE PARENT HTML
// =====================================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "parent-access.html"
        )
    );

});

// =====================================================
// STATIC FILES
// img.png etc.
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
            `Cezonal Parent Portal running on port ${PORT}`
        );

    }
);
