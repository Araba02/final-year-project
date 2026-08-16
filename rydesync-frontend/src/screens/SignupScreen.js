import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenWrap } from "../components/layout";
import { commonStyles } from "../theme/commonStyles";
import { ms } from "../utils/responsive";
import { COLORS } from "../theme/colors";
import { ROUTES } from "../navigation/routes";
import { useAuth } from "../context/AuthContext";

const Field = ({ icon, rightSlot, style, inputRef, ...props }) => (
  <View style={[styles.inputWrap, style]}>
    <Feather name={icon} size={ms(15)} color="rgba(255,255,255,0.28)" style={styles.fieldIcon} />
    <TextInput
      ref={inputRef}
      style={styles.fieldInput}
      placeholderTextColor="rgba(255,255,255,0.28)"
      {...props}
    />
    {rightSlot}
  </View>
);

const SubmitButton = ({ label, onPress, loading }) => (
  <View style={styles.btnShadow}>
    {loading ? (
      <View style={[styles.btnGradient, { backgroundColor: COLORS.fuchsia }]}>
        <ActivityIndicator color="#fff" />
      </View>
    ) : (
      <Pressable onPress={onPress} android_ripple={{ color: "rgba(255,255,255,0.15)" }}>
        <LinearGradient
          colors={["#ff79c0", COLORS.fuchsia, "#c2005a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.btnGradient}
        >
          <Text style={styles.btnText}>{label}</Text>
          <View style={styles.btnArrow}>
            <Feather name="arrow-right" size={ms(15)} color={COLORS.fuchsia} />
          </View>
        </LinearGradient>
      </Pressable>
    )}
  </View>
);

export const SignupScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const emailRef    = useRef(null);
  const phoneRef    = useRef(null);
  const passwordRef = useRef(null);

  const onSubmit = async () => {
    setError(null);
    if (!fullName.trim() || !email.trim() || !password) {
      setError("Please fill in your name, email and password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await register({ fullName: fullName.trim(), email: email.trim(), password });
      navigation.reset({ index: 0, routes: [{ name: ROUTES.HOME }] });
    } catch (err) {
      setError(err?.message || "Unable to create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenWrap contentStyle={styles.screenContent}>
      {/* Ambient glow decorations */}
      <View style={styles.glow1} pointerEvents="none" />
      <View style={styles.glow2} pointerEvents="none" />

      <View style={styles.layout}>
        {/* ─── Brand + Heading ─── */}
        <View style={styles.topSection}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons name="car" size={ms(20)} color={COLORS.fuchsia} />
            </View>
            <Text style={styles.brandLabel}>RideSync+</Text>
          </View>

          <Text style={styles.heading}>{"Create\nAccount."}</Text>
          <Text style={styles.subheading}>Get instant access to live ride rates.</Text>
        </View>

        {/* ─── Form ─── */}
        <View style={styles.formSection}>
          {error ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={ms(14)} color="#ffb6d7" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.fields}>
            <Field
              icon="user"
              placeholder="Full name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              editable={!submitting}
            />
            <Field
              inputRef={emailRef}
              icon="mail"
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              editable={!submitting}
            />
            <Field
              inputRef={phoneRef}
              icon="phone"
              placeholder="Phone number (optional)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              editable={!submitting}
            />
            <Field
              inputRef={passwordRef}
              icon="lock"
              placeholder="Password (min 8 characters)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
              editable={!submitting}
              rightSlot={
                <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={10} style={styles.eyeBtn}>
                  <Feather
                    name={showPw ? "eye-off" : "eye"}
                    size={ms(15)}
                    color="rgba(255,255,255,0.28)"
                  />
                </Pressable>
              }
            />
          </View>

          <SubmitButton label="Create Account" onPress={onSubmit} loading={submitting} />
        </View>

        {/* ─── Social + Footer ─── */}
        <View style={styles.bottomSection}>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>or sign up with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <Pressable style={styles.socialBtn}>
              <Ionicons name="logo-google" size={ms(17)} color="rgba(255,255,255,0.75)" />
              <Text style={styles.socialBtnText}>Google</Text>
            </Pressable>
            <Pressable style={styles.socialBtn}>
              <Ionicons name="logo-apple" size={ms(19)} color="rgba(255,255,255,0.75)" />
              <Text style={styles.socialBtnText}>Apple</Text>
            </Pressable>
          </View>

          <View style={commonStyles.centeredRow}>
            <Text style={styles.footerPrompt}>Already have an account?  </Text>
            <Pressable onPress={() => navigation.navigate(ROUTES.LOGIN)} hitSlop={8}>
              <Text style={styles.footerLink}>Login</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenWrap>
  );
};

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
    paddingBottom: 0,
  },
  layout: {
    flex: 1,
    justifyContent: "space-between",
  },
  glow1: {
    position: "absolute",
    top: ms(-100),
    right: ms(-80),
    width: ms(280),
    height: ms(280),
    borderRadius: ms(140),
    backgroundColor: COLORS.fuchsia,
    opacity: 0.09,
  },
  glow2: {
    position: "absolute",
    bottom: ms(100),
    left: ms(-100),
    width: ms(200),
    height: ms(200),
    borderRadius: ms(100),
    backgroundColor: COLORS.fuchsia,
    opacity: 0.05,
  },
  topSection: {
    paddingTop: ms(8),
    gap: ms(10),
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(10),
    marginBottom: ms(4),
  },
  logoBadge: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(12),
    backgroundColor: COLORS.fuchsiaSoft,
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  brandLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: ms(13),
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  heading: {
    fontSize: ms(34),
    fontWeight: "700",
    color: "#fff",
    lineHeight: ms(40),
    letterSpacing: -0.8,
  },
  subheading: {
    fontSize: ms(13),
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 0.1,
    marginTop: ms(2),
  },
  formSection: {
    gap: ms(14),
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(8),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
    backgroundColor: "rgba(255,79,154,0.1)",
    paddingHorizontal: ms(14),
    paddingVertical: ms(10),
  },
  errorText: {
    color: "#ffb6d7",
    fontSize: ms(12),
    flex: 1,
  },
  fields: {
    gap: ms(10),
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: ms(52),
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: ms(14),
    gap: ms(10),
  },
  fieldIcon: {
    width: ms(18),
    textAlign: "center",
  },
  fieldInput: {
    flex: 1,
    color: "#fff",
    fontSize: ms(14),
    height: "100%",
  },
  eyeBtn: {
    padding: ms(4),
  },
  btnShadow: {
    borderRadius: ms(14),
    shadowColor: COLORS.fuchsia,
    shadowOpacity: 0.45,
    shadowRadius: ms(18),
    shadowOffset: { width: 0, height: ms(8) },
    overflow: "hidden",
  },
  btnGradient: {
    height: ms(54),
    borderRadius: ms(14),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ms(12),
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: ms(15),
    letterSpacing: 0.2,
  },
  btnArrow: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(8),
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSection: {
    gap: ms(14),
    paddingBottom: ms(48), // clears home indicator on all iPhones (34pt inset + breathing room)
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(10),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  dividerLabel: {
    fontSize: ms(11),
    color: "rgba(255,255,255,0.3)",
  },
  socialRow: {
    flexDirection: "row",
    gap: ms(12),
  },
  socialBtn: {
    flex: 1,
    height: ms(50),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ms(8),
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  socialBtnText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: ms(13),
    fontWeight: "600",
  },
  footerPrompt: {
    color: "rgba(255,255,255,0.4)",
    fontSize: ms(13),
  },
  footerLink: {
    color: COLORS.fuchsia,
    fontSize: ms(13),
    fontWeight: "700",
  },
});

export default SignupScreen;
