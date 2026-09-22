const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();

const PORT = process.env.PORT || 10000;

// SUPABASE — ANON KEY ONLY
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

// HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Cezonal Parent Portal Server Running"
  });
});
app.post("/api/login", async (req, res) => {
    try {

        if (!supabase) {
            return res.status(500).json({
                success: false,
                message: "Supabase is not configured"
            });
        }

        const { loginId, password } = req.body;

        if (!loginId || !password) {
            return res.status(400).json({
                success: false,
                message: "Login ID and password are required"
            });
        }

        const { data, error } = await supabase
            .from("institutions")
            .select("*")
            .eq("institution_id", loginId)
            .eq("access_password", password)
            .limit(1);

        if (error) {
            console.error("LOGIN ERROR:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }

        if (!data || data.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid login details"
            });
        }

        return res.json({
            success: true,
            institution: data[0]
        });

    } catch (error) {

        console.error("SERVER LOGIN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
});
// PARENT PORTAL HOME
app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "parent-access.html")
  );
});

// CARTOON IMAGE + OTHER STATIC FILES
app.use(express.static(__dirname));

// START SERVER
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Cezonal Parent Portal running on port ${PORT}`
  );
});
