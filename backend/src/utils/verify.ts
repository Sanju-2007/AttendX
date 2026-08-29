import axios from "axios";

const BASE_URL = "http://localhost:5001/api";

async function runTests() {
  console.log("=== STARTING END-TO-END API VERIFICATION ===");

  try {
    // Create an axios instance for student
    const studentClient = axios.create({
      baseURL: BASE_URL,
      withCredentials: true,
      headers: { "Content-Type": "application/json" }
    });

    // Create an axios instance for teacher
    const teacherClient = axios.create({
      baseURL: BASE_URL,
      withCredentials: true,
      headers: { "Content-Type": "application/json" }
    });

    // Helper to get cookies from response headers
    function extractCookie(res: any) {
      const setCookie = res.headers["set-cookie"];
      return setCookie ? setCookie[0] : "";
    }

    // 1. Log in as student
    console.log("\n[Step 1] Logging in as Student (student1@attendify.com)...");
    const studentLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "student1@attendify.com",
      password: "password123"
    });
    const studentCookie = extractCookie(studentLoginRes);
    studentClient.defaults.headers.Cookie = studentCookie;
    console.log("Student Logged In Successfully.");

    // 2. Log in as teacher to resolve the student's ID
    console.log("\n[Step 2] Logging in as Teacher (teacher@attendify.com)...");
    const teacherLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "teacher@attendify.com",
      password: "password123"
    });
    const teacherCookie = extractCookie(teacherLoginRes);
    teacherClient.defaults.headers.Cookie = teacherCookie;
    console.log("Teacher Logged In Successfully.");

    // Resolve Student ID
    console.log("Resolving Student Profile ID from teacher directory...");
    const teacherDataRes = await teacherClient.get("/teacher/data");
    const departmentStudents = teacherDataRes.data.departmentStudents || [];
    const studentRecord = departmentStudents.find((s: any) => s.user?.email === "student1@attendify.com");

    if (!studentRecord) {
      throw new Error("Could not find student in department directory.");
    }

    const studentId = studentRecord.id;
    console.log(`Resolved Student Profile ID: ${studentId}`);

    // 3. Fetch current student profile details
    console.log("\n[Step 3] Fetching Student profile details...");
    const meRes = await studentClient.get("/auth/me");
    const initialAllow = meRes.data.studentProfile?.allowSectionChange;
    console.log(`Student Name: ${meRes.data.firstName} ${meRes.data.lastName}`);
    console.log(`Class Change Allowed initially: ${initialAllow}`);

    // 4. Update Profile details
    console.log("\n[Step 4] Updating Student profile name...");
    const updateRes = await studentClient.put("/auth/profile", {
      firstName: "Jane Doe",
      lastName: "Smith"
    });
    console.log(`Update Response: ${updateRes.data.message}`);

    // 5. Verify Profile updated
    console.log("\n[Step 5] Re-fetching Student profile to verify updates...");
    const meUpdatedRes = await studentClient.get("/auth/me");
    console.log(`Updated Name in DB: ${meUpdatedRes.data.firstName} ${meUpdatedRes.data.lastName}`);
    if (meUpdatedRes.data.firstName === "Jane Doe") {
      console.log("✅ Profile Update Verification Passed.");
    } else {
      console.error("❌ Profile Update Verification Failed.");
    }

    // 6. Set class change allowance to TRUE
    console.log(`\n[Step 6] Teacher allowing class change for student ID ${studentId}...`);
    const allowRes = await teacherClient.post("/teacher/allow-class-change", {
      studentId: studentId,
      allow: true
    });
    console.log(`Teacher Response: ${allowRes.data.message}`);

    // 7. Verify student class change is unlocked
    console.log("\n[Step 7] Re-fetching Student details to verify class change is UNLOCKED...");
    const meUnlockedRes = await studentClient.get("/auth/me");
    const allowUnlocked = meUnlockedRes.data.studentProfile?.allowSectionChange;
    console.log(`Class Change Allowed after unlock: ${allowUnlocked}`);
    if (allowUnlocked === true) {
      console.log("✅ Teacher Unlock Verification Passed.");
    } else {
      console.error("❌ Teacher Unlock Verification Failed.");
    }

    // 8. Set class change allowance to FALSE (Lock it again)
    console.log(`\n[Step 8] Teacher locking class change for student ID ${studentId} again...`);
    const lockRes = await teacherClient.post("/teacher/allow-class-change", {
      studentId: studentId,
      allow: false
    });
    console.log(`Teacher Response: ${lockRes.data.message}`);

    // 9. Verify student class change is locked
    console.log("\n[Step 9] Re-fetching Student details to verify class change is LOCKED...");
    const meLockedRes = await studentClient.get("/auth/me");
    const allowLocked = meLockedRes.data.studentProfile?.allowSectionChange;
    console.log(`Class Change Allowed after lock: ${allowLocked}`);
    if (allowLocked === false) {
      console.log("✅ Teacher Lock Verification Passed.");
    } else {
      console.error("❌ Teacher Lock Verification Failed.");
    }

    // 10. Logout Verification
    console.log("\n[Step 10] Testing Student Logout API...");
    const logoutRes = await studentClient.post("/auth/logout");
    console.log(`Logout Response: ${logoutRes.data.message}`);
    
    // Clear the cookie manually to simulate browser clearing the cookie on Set-Cookie
    studentClient.defaults.headers.Cookie = "";
    
    // Verify unauthorized access after logout
    try {
      await studentClient.get("/auth/me");
      console.error("❌ Logout Verification Failed: Still able to access private routes.");
    } catch (err: any) {
      console.log("✅ Logout Verification Passed: Correctly returned unauthorized error.");
    }

    console.log("\n=== ALL API VERIFICATIONS COMPLETED ===");
  } catch (err: any) {
    console.error("❌ Verification failed with error:", err.message);
    if (err.response) {
      console.error("Response Details:", err.response.data);
    }
  }
}

runTests();
