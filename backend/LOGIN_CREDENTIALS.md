# 🔑 LOGIN CREDENTIALS

All users have the same password for easy testing.

## Password for ALL users:

```
password123
```

## Test Accounts:

### Candidate 1

- **Email:** `john.doe@example.com`
- **Password:** `password123`
- **Role:** CANDIDATE
- **Has:** 2 interviews (1 completed with 85%, 1 in-progress)

### Candidate 2

- **Email:** `jane.smith@example.com`
- **Password:** `password123`
- **Role:** CANDIDATE
- **Has:** 2 interviews (1 completed with 65%, 1 fresh start)

### Interviewer

- **Email:** `interviewer@example.com`
- **Password:** `password123`
- **Role:** INTERVIEWER
- **Has:** No interviews (can view/manage others)

### Candidate 3

- **Email:** `alex.chen@example.com`
- **Password:** `password123`
- **Role:** CANDIDATE
- **Has:** 2 interviews (1 completed with 45%, 1 completed with 92%)

## Quick Copy-Paste for Login:

**Candidate Login:**

```
Email: john.doe@example.com
Password: password123
```

**Interviewer Login:**

```
Email: interviewer@example.com
Password: password123
```

## How it works:

The seed file uses `bcrypt.hash("password123", 10)` to generate the hashed password, so when you login with `password123`, bcrypt will verify it correctly.
