const express = require("express");
const AuthService = require("./auth-service");

const authRouter = express.Router();
const jsonBodyParser = express.json();

authRouter.post("/login", jsonBodyParser, (req, res, next) => {
    const { email, password } = req.body;
    const loginUser = { email, password };

    for (const [key, value] of Object.entries(loginUser))
        if (value == null)
            return res.status(400).json({
                error: `Missing '${key}' in request body`
            });

    AuthService.getUserWithEmail(req.app.get("db"), loginUser.email)
        //if no dbUser
        .then(dbUser => {
            if (!dbUser)
                return res.status(400).json({
                    error: "Incorrect email or password, please try again"
                });
            return AuthService.comparePasswords(
                loginUser.password,
                dbUser.password
            ).then(compareMatch => {
                if (!compareMatch)
                    return res.status(400).json({
                        error: "Incorrect email or password, please try again"
                    });
                const sub = dbUser.email;
                const payload = { user_id: dbUser.id };
                res.send({
                    authToken: AuthService.createJwt(sub, payload)
                });
            });
        })
        .catch(next);
});
authRouter.post('/refresh', (req, res) => {
    const sub = req.user.email
    const payload = { user_id: req.user.id }
    res.send({
        authToken: AuthService.createJwt(sub, payload),
    })
})

module.exports = authRouter;