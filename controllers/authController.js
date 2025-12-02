const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendEmail } = require("../utils/sendEmail");

// ---------------------------------------------
// Helper: generate signed JWT
// ---------------------------------------------
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// ---------------------------------------------
// Helper: send token via cookie + response
// ---------------------------------------------
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res
    .status(statusCode)
    .cookie("token", token, cookieOptions)
    .json({
      success: true,
      token, // también en JSON si el frontend lo quiere
      user: user.getPublicProfile(),
    });
};

// ===================================================
// @route   POST /api/auth/register
// ===================================================
exports.register = async (req, res, next) => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      bio,
      specializations,
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "username, email y password son obligatorios.",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          existingUser.email === email
            ? "Ya existe un usuario con ese email."
            : "Ya existe un usuario con ese nombre de usuario.",
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      firstName: firstName || username,
      lastName: lastName || "",
      bio: bio || "",
      specializations: specializations || [],
    });

    user.lastLogin = new Date();
    await user.save();

    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error("Error en register:", err);
    next(err);
  }
};

// ===================================================
// @route   POST /api/auth/login
// ===================================================
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email y password son obligatorios.",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas.",
      });
    }

    if (user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: "La cuenta está desactivada.",
      });
    }

    user.lastLogin = new Date();
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error("Error en login:", err);
    next(err);
  }
};

// ===================================================
// @route   POST /api/auth/logout
// ===================================================
exports.logout = async (req, res) => {
  try {
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    console.error("Error en logout:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// ===================================================
// @route   GET /api/auth/me
// ===================================================
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("mediaCount")
      .populate("projectCount");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado.",
      });
    }

    return res.status(200).json({
      success: true,
      user: user.getPublicProfile(),
    });
  } catch (err) {
    console.error("Error en getMe:", err);
    next(err);
  }
};

// ===================================================
// @route   PUT /api/auth/updatedetails
// ===================================================
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      bio: req.body.bio,
      specializations: req.body.specializations,
      socialLinks: req.body.socialLinks,
    };

    Object.keys(fieldsToUpdate).forEach((key) => {
      if (fieldsToUpdate[key] === undefined) delete fieldsToUpdate[key];
    });

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      user: user.getPublicProfile(),
    });
  } catch (err) {
    console.error("🔥 Error en updateDetails:", err);
    next(err);
  }
};

// ===================================================
// @route   PUT /api/auth/updatepassword
// ===================================================
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Debes enviar la contraseña actual y la nueva.",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        message: "La contraseña actual es incorrecta.",
      });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error("🔥 Error en updatePassword:", err);
    next(err);
  }
};

// ===================================================
// @route   POST /api/auth/forgot-password
// ===================================================
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email es obligatorio.",
      });
    }

    const user = await User.findOne({ email });

    // Protección: no revelar si existe o no
    if (!user) {
      return res.json({
        success: true,
        message:
          "If this email is registered, a password reset link has been sent.",
      });
    }

    // Token seguro
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hora
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = `
      <p>You requested a password reset for your account.</p>
      <p>Click the link to reset your password (valid for 1 hour):</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
    `;

    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      html,
    });

    return res.json({
      success: true,
      message:
        "If this email is registered, a password reset link has been sent.",
    });
  } catch (err) {
    console.error("Error en forgotPassword:", err);
    next(err);
  }
};

// ===================================================
// @route   POST /api/auth/reset-password
// ===================================================
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token y nueva contraseña son obligatorios.",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token inválido o expirado.",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return res.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (err) {
    console.error("Error en resetPassword:", err);
    next(err);
  }
};

// ===================================================
// @route   POST /api/auth/verify
// ===================================================
exports.verifyToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token requerido.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        valid: false,
        message: "Token inválido.",
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      user: user.getPublicProfile(),
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      valid: false,
      message: "Token inválido.",
    });
  }
};
