/**
 * navigation/RootNavigator.js
 * ────────────────────────────
 * The app's native-stack navigator. Screen components are referenced
 * directly (no inline component definitions) so navigation state stays
 * stable across renders.
 */
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { COLORS } from "../theme/colors";
import { ROUTES } from "./routes";
import {
  SplashScreen,
  OnboardingCompare,
  OnboardingFavorites,
  OnboardingInsights,
  LoginScreen,
  SignupScreen,
  LoadingScreen,
  HomeScreen,
  CompareRidesScreen,
  RideMatchScreen,
  RideDetailsScreen,
  ExploreScreen,
  HistoryScreen,
  ProfileScreen,
  EditProfileScreen,
  EditLocationScreen,
  InsightsScreen,
} from "../screens";

const Stack = createNativeStackNavigator();

export const RootNavigator = () => (
  <Stack.Navigator
    initialRouteName={ROUTES.SPLASH}
    screenOptions={{
      headerShown: false,
      animation: "fade",
      contentStyle: { backgroundColor: COLORS.bg },
    }}
  >
    <Stack.Screen name={ROUTES.SPLASH} component={SplashScreen} />
    <Stack.Screen name={ROUTES.ONBOARDING_COMPARE} component={OnboardingCompare} />
    <Stack.Screen name={ROUTES.ONBOARDING_FAVORITES} component={OnboardingFavorites} />
    <Stack.Screen name={ROUTES.ONBOARDING_INSIGHTS} component={OnboardingInsights} />
    <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
    <Stack.Screen name={ROUTES.SIGNUP} component={SignupScreen} />
    <Stack.Screen name={ROUTES.LOADING} component={LoadingScreen} />
    <Stack.Screen name={ROUTES.HOME} component={HomeScreen} />
    <Stack.Screen name={ROUTES.COMPARE_RIDES} component={CompareRidesScreen} />
    <Stack.Screen name={ROUTES.RIDE_MATCH} component={RideMatchScreen} />
    <Stack.Screen name={ROUTES.RIDE_DETAILS} component={RideDetailsScreen} />
    <Stack.Screen name={ROUTES.EXPLORE} component={ExploreScreen} />
    <Stack.Screen name={ROUTES.HISTORY} component={HistoryScreen} />
    <Stack.Screen name={ROUTES.PROFILE} component={ProfileScreen} />
    <Stack.Screen name={ROUTES.EDIT_PROFILE} component={EditProfileScreen} />
    <Stack.Screen name={ROUTES.EDIT_LOCATION} component={EditLocationScreen} />
    <Stack.Screen name={ROUTES.INSIGHTS} component={InsightsScreen} />
  </Stack.Navigator>
);

export default RootNavigator;
