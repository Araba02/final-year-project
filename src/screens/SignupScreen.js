/**
 * screens/SignupScreen.js
 * ────────────────────────
 * Account creation wired to the auth backend (register → auto-login). Layout
 * matches the Figma "Create Account" frame; adds controlled inputs,
 * validation, an inline error banner and a loading state.
 */
import React, { useState } from "react";
import { View, Text, Pressable, TextInput, ActivityIndicator } from "react-native";

import { ScreenWrap } from "../components/layout";
import { PrimaryButton, SecondaryButton } from "../components/Button";
import { commonStyles } from "../theme/commonStyles";
import { ms } from "../utils/responsive";
import { ROUTES } from "../navigation/routes";
import { useAuth } from "../context/AuthContext";
import { authStyles } from "./authStyles";

export const SignupScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!fullName.trim() || !email.trim() || !password) {
      setError("Please fill in your name, email and password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
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
    <ScreenWrap title="Create Account">
      <View style={{ gap: ms(16) }}>
        <View>
          <Text style={commonStyles.sectionTitle}>Create Account</Text>
          <Text style={commonStyles.sectionSubtitle}>Get instant access to live ride rates.</Text>
        </View>

        {error ? (
          <View style={authStyles.errorBanner}>
            <Text style={authStyles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={{ gap: ms(12) }}>
          <TextInput
            placeholder="Full name"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={commonStyles.input}
            value={fullName}
            onChangeText={setFullName}
            editable={!submitting}
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={commonStyles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!submitting}
          />
          <TextInput
            placeholder="Phone"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={commonStyles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!submitting}
          />
          <TextInput
            placeholder="Password (min 8 characters)"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={commonStyles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!submitting}
            onSubmitEditing={onSubmit}
          />
        </View>

        {submitting ? (
          <View style={authStyles.submitting}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : (
          <PrimaryButton label="Create Account" onPress={onSubmit} />
        )}

        <View style={commonStyles.dividerRow}>
          <View style={commonStyles.dividerLine} />
          <Text style={commonStyles.dividerText}>sign up with</Text>
          <View style={commonStyles.dividerLine} />
        </View>
        <View style={commonStyles.socialRow}>
          <SecondaryButton label="Google" />
          <SecondaryButton label="Apple" />
        </View>
        <View style={commonStyles.centeredRow}>
          <Text style={commonStyles.smallText}>Already have an account? </Text>
          <Pressable onPress={() => navigation.navigate(ROUTES.LOGIN)}>
            <Text style={commonStyles.linkText}>Login</Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrap>
  );
};

export default SignupScreen;
