import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { useAuth } from "../context/AuthContext";

interface AuthScreenProps {
  onClose: () => void;
  onSuccess: () => void;
  contextNotice?: string | null;
}

type AuthMode = "signin" | "signup" | "forgot";

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onClose,
  onSuccess,
  contextNotice,
}) => {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { signIn, signUp, resetPassword, signInWithGoogle } = useAuth();

  const isSignUp = mode === "signup";
  const isForgot = mode === "forgot";

  const handleGoogleSignIn = async () => {
    setError(null);
    setMessage(null);
    setGoogleLoading(true);
    try {
      const res = await signInWithGoogle();
      if (res.ok) {
        onSuccess();
      } else if (res.error && res.error !== "Sign in was cancelled.") {
        setError(res.error);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Google sign-in failed";
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);

    if (!email.trim() || !email.includes("@")) {
      return setError("Please enter a valid email address.");
    }

    if (isForgot) {
      setLoading(true);
      try {
        const res = await resetPassword(email);
        if (res.ok) {
          setMessage(res.message || "Reset link sent! Please check your email inbox.");
        } else {
          setError(res.error || "Failed to send reset link.");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error sending reset email");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password || password.length < 8) {
      return setError("Password must be at least 8 characters.");
    }

    if (isSignUp) {
      if (!fullName.trim()) {
        return setError("Please enter your full name.");
      }
      if (password !== confirmPassword) {
        return setError("Passwords do not match.");
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const res = await signUp(email, password, fullName);
        if (res.ok) {
          if (res.message) {
            setMessage(res.message);
            setMode("signin");
          } else {
            onSuccess();
          }
        } else {
          setError(res.error || "Failed to create account.");
        }
      } else {
        const res = await signIn(email, password);
        if (res.ok) {
          onSuccess();
        } else {
          setError(res.error || "Invalid email or password.");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* Top Header Bar with Close Button */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          accessibilityLabel="Close auth modal"
        >
          <Ionicons name="close" size={24} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Logo */}
          <Text style={styles.brandTitle}>
            sonora<Text style={{ color: colors.accent }}>.</Text>
          </Text>

          {/* Switcher at top (matching web /login) */}
          {!isForgot ? (
            <View style={styles.topSwitcher}>
              <Text style={styles.switcherPrompt}>
                {isSignUp ? "Already have an account?" : "New to sonora?"}{" "}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setError(null);
                  setMessage(null);
                  setMode(isSignUp ? "signin" : "signup");
                }}
              >
                <Text style={styles.switcherAction}>
                  {isSignUp ? "Sign In" : "Sign Up"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.topSwitcher}>
              <TouchableOpacity
                onPress={() => {
                  setError(null);
                  setMessage(null);
                  setMode("signin");
                }}
              >
                <Text style={styles.switcherAction}>‹ Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Context Notice for Protected Route Gate */}
          {!!contextNotice && (
            <View style={styles.noticeBox}>
              <Ionicons name="lock-closed" size={15} color={colors.accent} />
              <Text style={styles.noticeText}>{contextNotice}</Text>
            </View>
          )}

          {/* Heading & Subhead */}
          <Text style={styles.heading}>
            {isForgot
              ? "RESET YOUR PASSWORD"
              : isSignUp
              ? "JOIN SONORA TODAY"
              : "WELCOME BACK"}
          </Text>
          <Text style={styles.sub}>
            {isForgot
              ? "Enter the email you signed up with and we'll send you a link to choose a new password."
              : isSignUp
              ? "Create your account to track orders and check out faster."
              : "Sign in to track your orders and check out faster."}
          </Text>

          {/* Error Alert Box */}
          {error && (
            <View style={styles.alertBox}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
              <Text style={styles.alertText}>{error}</Text>
            </View>
          )}

          {/* Status Alert Box */}
          {message && (
            <View style={[styles.alertBox, styles.successBox]}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.accent} />
              <Text style={[styles.alertText, { color: colors.accent }]}>
                {message}
              </Text>
            </View>
          )}

          {/* Full Name field (only for signup) */}
          {isSignUp && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>FULL NAME</Text>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ada Lovelace"
                placeholderTextColor="rgba(19, 19, 19, 0.35)"
                autoCapitalize="words"
              />
            </View>
          )}

          {/* Email field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>EMAIL</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
              placeholderTextColor="rgba(19, 19, 19, 0.35)"
            />
          </View>

          {/* Password fields (hidden during forgot mode) */}
          {!isForgot && (
            <>
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>PASSWORD</Text>
                  {isSignUp ? (
                    <Text style={styles.labelHint}>8 characters min</Text>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        setError(null);
                        setMessage(null);
                        setMode("forgot");
                      }}
                    >
                      <Text style={styles.forgotLink}>Forgot password?</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholder={isSignUp ? "Create a password" : "Enter your password"}
                    placeholderTextColor="rgba(19, 19, 19, 0.35)"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeBtnText}>
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password (only for signup) */}
              {isSignUp && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
                  <TextInput
                    style={[styles.input, error ? styles.inputError : null]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Repeat your password"
                    placeholderTextColor="rgba(19, 19, 19, 0.35)"
                  />
                </View>
              )}
            </>
          )}

          {/* Primary Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>
                {isForgot
                  ? "SEND RESET LINK"
                  : isSignUp
                  ? "SIGN UP"
                  : "SIGN IN"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider matching web auth */}
          {!isForgot && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Button */}
              <TouchableOpacity
                style={[
                  styles.googleBtn,
                  (loading || googleLoading) && { opacity: 0.7 },
                ]}
                activeOpacity={0.85}
                disabled={loading || googleLoading}
                onPress={handleGoogleSignIn}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color="#EA4335" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={18} color="#EA4335" />
                    <Text style={styles.googleBtnText}>
                      {isSignUp ? "Sign up with Google" : "Sign in with Google"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Terms & Privacy note */}
          <Text style={styles.termsText}>
            By continuing, you agree to our{" "}
            <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: "flex-end",
  },
  closeBtn: {
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    justifyContent: "center",
  },
  card: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.tan,
    maxWidth: 440,
    width: "100%",
    alignSelf: "center",
  },
  brandTitle: {
    fontFamily: fonts.display,
    fontSize: 26,
    fontWeight: "900",
    color: colors.ink,
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  topSwitcher: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  switcherPrompt: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: "rgba(19, 19, 19, 0.55)",
  },
  switcherAction: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
    textDecorationLine: "underline",
  },
  heading: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: "900",
    color: colors.ink,
    textAlign: "center",
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: "rgba(19, 19, 19, 0.5)",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  noticeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(201, 138, 82, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(201, 138, 82, 0.4)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
  },
  noticeText: {
    fontFamily: fonts.sans,
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
    lineHeight: 16,
  },
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(214, 69, 69, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(214, 69, 69, 0.3)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  successBox: {
    backgroundColor: "rgba(201, 138, 82, 0.1)",
    borderColor: "rgba(201, 138, 82, 0.4)",
  },
  alertText: {
    fontFamily: fonts.sans,
    color: colors.danger,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    lineHeight: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
  },
  fieldLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: colors.ink,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  labelHint: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: "rgba(19, 19, 19, 0.4)",
  },
  forgotLink: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: "rgba(19, 19, 19, 0.5)",
    textDecorationLine: "underline",
  },
  input: {
    fontFamily: fonts.sans,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.tan,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    color: colors.ink,
  },
  inputError: {
    borderColor: colors.danger,
  },
  passwordWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 64,
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  eyeBtnText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: "rgba(19, 19, 19, 0.45)",
    textTransform: "uppercase",
  },
  submitBtn: {
    backgroundColor: colors.ink,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnText: {
    fontFamily: fonts.sans,
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.tan,
  },
  dividerText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    letterSpacing: 1.5,
    color: "rgba(19, 19, 19, 0.35)",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.tan,
    borderRadius: 8,
    paddingVertical: 13,
    gap: 10,
    backgroundColor: colors.white,
  },
  googleBtnText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
  },
  termsText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: "rgba(19, 19, 19, 0.4)",
    textAlign: "center",
    lineHeight: 16,
    marginTop: 22,
  },
  termsLink: {
    textDecorationLine: "underline",
    color: "rgba(19, 19, 19, 0.55)",
  },
});
