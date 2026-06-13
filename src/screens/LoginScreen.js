/**
 * screens/LoginScreen.js
 * ───────────────────────
 * Email / password login wired to the auth backend. Layout matches the
 * Figma "Welcome Back" frame; adds controlled inputs, validation, an inline
 * error banner and a loading state.
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

export const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigation.reset({ index: 0, routes: [{ name: ROUTES.HOME }] });
    } catch (err) {
      setError(err?.message || "Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenWrap title="Welcome Back">
      <View style={{ gap: ms(16) }}>
        <View>
          <Text style={commonStyles.sectionTitle}>Welcome Back</Text>
          <Text style={commonStyles.sectionSubtitle}>Compare prices. Save on rides.</Text>
        </View>

        {error ? (
          <View style={authStyles.errorBanner}>
            <Text style={authStyles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={{ gap: ms(12) }}>
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
            placeholder="Password"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={commonStyles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!submitting}
            onSubmitEditing={onSubmit}
          />
          <Text style={commonStyles.linkText}>Forgot Password?</Text>
        </View>

        {submitting ? (
          <View style={authStyles.submitting}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : (
          <PrimaryButton label="Login" onPress={onSubmit} />
        )}

        <View style={commonStyles.dividerRow}>
          <View style={commonStyles.dividerLine} />
          <Text style={commonStyles.dividerText}>or continue with</Text>
          <View style={commonStyles.dividerLine} />
        </View>
        <View style={commonStyles.socialRow}>
          <SecondaryButton label="Google" />
          <SecondaryButton label="Apple" />
        </View>
        <View style={commonStyles.centeredRow}>
          <Text style={commonStyles.smallText}>Dont have an account? </Text>
          <Pressable onPress={() => navigation.navigate(ROUTES.SIGNUP)}>
            <Text style={commonStyles.linkText}>Sign up</Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrap>
  );
};

export default LoginScreen;
