import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Image,
  TextInput
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const mapPhoto = require("./assets/mapphoto.png");
const Stack = createNativeStackNavigator();

const COLORS = {
  bg: "#12060c",
  card: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.10)",
  text: "#F7EAF3",
  muted: "rgba(255,255,255,0.6)",
  fuchsia: "#ff4f9a",
  fuchsiaSoft: "rgba(255,79,154,0.2)",
  fuchsiaBorder: "rgba(255,79,154,0.35)",
  glass: "rgba(42,15,28,0.55)"
};

const PrimaryButton = ({ label, onPress, style }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed, style]}>
    <Text style={styles.primaryButtonText}>{label}</Text>
  </Pressable>
);

const SecondaryButton = ({ label, onPress, style }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed, style]}>
    <Text style={styles.secondaryButtonText}>{label}</Text>
  </Pressable>
);

const ScreenWrap = ({ title, children, footer, contentStyle, scroll = true }) => (
  <SafeAreaView style={styles.safeArea}>
    <StatusBar style="light" />
    <View style={styles.screen}>
      {title ? (
        <Text style={styles.screenTitle}>{title}</Text>
      ) : null}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.scrollContent, contentStyle]}>{children}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  </SafeAreaView>
);

const BottomNav = ({ navigation, active }) => {
  const items = [
    { id: "home", label: "HOME", icon: "home", target: "Home" },
    { id: "history", label: "HISTORY", icon: "clock", target: "History" },
    { id: "map", label: "MAP", icon: "map-pin", target: "Explore", center: true },
    { id: "insights", label: "INSIGHTS", icon: "bar-chart-2", target: "Insights" },
    { id: "profile", label: "PROFILE", icon: "user", target: "Profile" }
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map((item) => {
        const isActive = active === item.id;
        if (item.center) {
          return (
            <Pressable
              key={item.id}
              onPress={() => navigation.navigate(item.target)}
              style={styles.bottomNavCenter}
            >
              <View style={styles.bottomNavCenterInner}>
                <Feather name={item.icon} size={20} color={COLORS.text} />
              </View>
            </Pressable>
          );
        }
        return (
          <Pressable
            key={item.id}
            onPress={() => navigation.navigate(item.target)}
            style={styles.bottomNavItem}
          >
            <Feather name={item.icon} size={20} color={isActive ? COLORS.fuchsia : "rgba(255,255,255,0.5)"} />
            <Text style={[styles.bottomNavLabel, isActive && styles.bottomNavLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const HeroCompare = () => (
  <View style={styles.heroWrap}>
    <View style={styles.heroShadow} />
    <View style={styles.heroRotate}>
      <View style={styles.heroCard}>
        <View style={styles.heroMapInset}>
          <Image source={mapPhoto} style={styles.heroMapImage} resizeMode="cover" />
          <View style={styles.heroMapTint} />
        </View>
        <View style={styles.heroPinOuter} />
        <View style={styles.heroPinInner} />
        <View style={styles.heroPinRing} />
        <View style={styles.heroPricePill}>
          <View style={styles.heroPriceLeft}>
            <View style={styles.heroCarBadge}>
              <MaterialCommunityIcons name="car" size={16} color="#ffb6d7" />
            </View>
            <View style={styles.heroPriceLine} />
          </View>
          <Text style={styles.heroPriceText}>GHS 12.50</Text>
        </View>
      </View>
    </View>
  </View>
);

const HeroFavorites = () => (
  <View style={styles.heroWrap}>
    <View style={styles.heroShadow} />
    <View style={styles.heroRotate}>
      <View style={styles.heroCard}>
        <View style={styles.heroFavoritesPin}>
          <Ionicons name="location" size={18} color="#ffb6d7" />
        </View>
        <View style={styles.heroFavRow}>
          <View style={styles.heroFavItem}>
            <View style={styles.heroFavIcon}>
              <Feather name="home" size={16} color="#ffb6d7" />
            </View>
            <Text style={styles.heroFavLabel}>Home</Text>
            <Text style={styles.heroFavMeta}>Set address</Text>
          </View>
          <View style={styles.heroFavItem}>
            <View style={styles.heroFavIcon}>
              <Feather name="briefcase" size={16} color="#ffb6d7" />
            </View>
            <Text style={styles.heroFavLabel}>Work</Text>
            <Text style={styles.heroFavMeta}>Set address</Text>
          </View>
          <View style={styles.heroFavItem}>
            <View style={styles.heroFavIcon}>
              <Feather name="book" size={16} color="#ffb6d7" />
            </View>
            <Text style={styles.heroFavLabel}>School</Text>
            <Text style={styles.heroFavMeta}>Set address</Text>
          </View>
        </View>
      </View>
    </View>
  </View>
);

const HeroInsights = () => (
  <View style={styles.heroWrap}>
    <View style={styles.heroShadow} />
    <View style={styles.heroRotate}>
      <View style={[styles.heroCard, styles.heroInsightsCard]}>
        <View style={styles.heroInsightsHeader}>
          <View>
            <Text style={styles.heroInsightsLabel}>PRICE TREND</Text>
            <Text style={styles.heroInsightsValue}>-12%</Text>
            <Text style={styles.heroInsightsMeta}>dropping</Text>
          </View>
          <View style={styles.heroInsightsIcon}>
            <Feather name="trending-down" size={16} color="#ffb6d7" />
          </View>
        </View>
        <View style={styles.heroSmartCard}>
          <View style={styles.heroStars}>
            <Ionicons name="sparkles" size={14} color="#fff" />
            <Ionicons name="sparkles" size={9} color="#fff" style={{ marginLeft: -4, marginTop: 6 }} />
            <Ionicons name="sparkles" size={9} color="#fff" style={{ marginLeft: -2, marginTop: -10 }} />
          </View>
          <View style={styles.heroSmartText}>
            <View style={styles.heroSmartRow}>
              <Text style={styles.heroSmartTitle}>Smart Recommendation</Text>
              <Text style={styles.heroSmartArrow}>&gt;</Text>
            </View>
            <Text style={styles.heroSmartMeta}>UberX is cheaper than Bolt at 3:00pm</Text>
          </View>
        </View>
        <View style={styles.heroInsightsPin}>
          <Ionicons name="location" size={14} color="#ffb6d7" />
        </View>
      </View>
    </View>
  </View>
);

const OnboardingTemplate = ({ navigation, title, subtitle, next, buttonLabel, showSkip, hero }) => {
  const Hero = hero === "favorites" ? HeroFavorites : hero === "insights" ? HeroInsights : HeroCompare;
  return (
    <ScreenWrap title={null} scroll={false} contentStyle={styles.onboardingContent}>
      <View style={styles.onboardingHeader}>
        <Pressable style={styles.onboardingClose}>
          <Text style={styles.onboardingCloseText}>x</Text>
        </Pressable>
        <Text style={styles.onboardingBrand}>RideSync+</Text>
      </View>
      <View style={styles.onboardingBody}>
        <Hero />
        <Text style={styles.onboardingTitle}>{title}</Text>
        <Text style={styles.onboardingSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.onboardingFooter}>
        <View style={styles.onboardingDots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <PrimaryButton label={buttonLabel} onPress={() => navigation.navigate(next)} />
        {showSkip ? (
          <Pressable onPress={() => navigation.navigate("Login")}>
            <Text style={styles.skipText}>Skip intro</Text>
          </Pressable>
        ) : null}
      </View>
    </ScreenWrap>
  );
};

const Splash = ({ navigation }) => (
  <ScreenWrap title="RideSync+" scroll={false}>
    <View style={styles.centered}>
      <View style={styles.logoBadge}>
        <MaterialCommunityIcons name="car" size={32} color={COLORS.fuchsia} />
      </View>
      <Text style={styles.splashTitle}>RideSync+</Text>
      <Text style={styles.splashSubtitle}>Smart ride matching in your city.</Text>
      <View style={{ width: "100%", marginTop: 30 }}>
        <PrimaryButton label="Get Started" onPress={() => navigation.navigate("OnboardingCompare")} />
      </View>
    </View>
  </ScreenWrap>
);

const Login = ({ navigation }) => (
  <ScreenWrap title="Welcome Back">
    <View style={{ gap: 16 }}>
      <View>
        <Text style={styles.sectionTitle}>Welcome Back</Text>
        <Text style={styles.sectionSubtitle}>Compare prices. Save on rides.</Text>
      </View>
      <View style={{ gap: 12 }}>
        <TextInput placeholder="Email" placeholderTextColor="rgba(255,255,255,0.4)" style={styles.input} />
        <TextInput placeholder="Password" placeholderTextColor="rgba(255,255,255,0.4)" style={styles.input} secureTextEntry />
        <Text style={styles.linkText}>Forgot Password?</Text>
      </View>
      <PrimaryButton label="Login" onPress={() => navigation.navigate("Home")} />
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>
      <View style={styles.socialRow}>
        <SecondaryButton label="Google" />
        <SecondaryButton label="Apple" />
      </View>
      <View style={styles.centeredRow}>
        <Text style={styles.smallText}>Dont have an account? </Text>
        <Pressable onPress={() => navigation.navigate("Signup")}>
          <Text style={styles.linkText}>Sign up</Text>
        </Pressable>
      </View>
    </View>
  </ScreenWrap>
);

const Signup = ({ navigation }) => (
  <ScreenWrap title="Create Account">
    <View style={{ gap: 16 }}>
      <View>
        <Text style={styles.sectionTitle}>Create Account</Text>
        <Text style={styles.sectionSubtitle}>Get instant access to live ride rates.</Text>
      </View>
      <View style={{ gap: 12 }}>
        <TextInput placeholder="Full name" placeholderTextColor="rgba(255,255,255,0.4)" style={styles.input} />
        <TextInput placeholder="Email" placeholderTextColor="rgba(255,255,255,0.4)" style={styles.input} />
        <TextInput placeholder="Phone" placeholderTextColor="rgba(255,255,255,0.4)" style={styles.input} />
        <TextInput placeholder="Password" placeholderTextColor="rgba(255,255,255,0.4)" style={styles.input} secureTextEntry />
      </View>
      <PrimaryButton label="Create Account" onPress={() => navigation.navigate("Home")} />
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>sign up with</Text>
        <View style={styles.dividerLine} />
      </View>
      <View style={styles.socialRow}>
        <SecondaryButton label="Google" />
        <SecondaryButton label="Apple" />
      </View>
      <View style={styles.centeredRow}>
        <Text style={styles.smallText}>Already have an account? </Text>
        <Pressable onPress={() => navigation.navigate("Login")}>
          <Text style={styles.linkText}>Login</Text>
        </Pressable>
      </View>
    </View>
  </ScreenWrap>
);

const Loading = () => (
  <ScreenWrap title="RideSync+" scroll={false}>
    <View style={styles.centered}>
      <View style={styles.loadingBadge}>
        <MaterialCommunityIcons name="car" size={38} color={COLORS.fuchsia} />
      </View>
      <Text style={styles.loadingTitle}>RideSync+</Text>
      <View style={styles.loadingDots}>
        <View style={[styles.loadingDot, { backgroundColor: COLORS.fuchsia }]} />
        <View style={[styles.loadingDot, { backgroundColor: "rgba(255,79,154,0.6)" }]} />
        <View style={[styles.loadingDot, { backgroundColor: "rgba(255,79,154,0.3)" }]} />
      </View>
      <Text style={styles.loadingText}>Syncing ride options...</Text>
    </View>
  </ScreenWrap>
);

const Home = ({ navigation }) => (
  <ScreenWrap title="RideSync+" footer={<BottomNav navigation={navigation} active="home" />}>
    <View style={{ gap: 16 }}>
      <View style={styles.homeHeader}>
        <View style={styles.homeBrand}>
          <View style={styles.homeBadge}>
            <MaterialCommunityIcons name="car" size={16} color="#ffb6d7" />
          </View>
          <Text style={styles.homeBrandText}>RideSync+</Text>
        </View>
        <View style={styles.homeAvatar} />
      </View>
      <Text style={styles.homeGreeting}>
        Where to, <Text style={{ color: COLORS.fuchsia }}>Alexa</Text>?
      </Text>
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>PICKUP</Text>
        <View style={styles.inputPill}>
          <View style={styles.pillIcon}>
            <Text style={styles.pillIconText}>O</Text>
          </View>
          <Text style={styles.pillText}>123 Innovation Drive, Tech City</Text>
        </View>
        <Text style={[styles.sectionLabel, { marginTop: 14 }]}>DESTINATION</Text>
        <View style={[styles.inputPill, { opacity: 0.7 }]}>
          <View style={[styles.pillIcon, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
            <Text style={[styles.pillIconText, { color: "rgba(255,255,255,0.6)" }]}>X</Text>
          </View>
          <Text style={[styles.pillText, { color: "rgba(255,255,255,0.6)" }]}>Where are you heading?</Text>
        </View>
        <View style={{ marginTop: 16 }}>
          <PrimaryButton label="Compare Rides ->" onPress={() => navigation.navigate("RideMatch")} />
        </View>
      </View>
      <View style={styles.mapCard}>
        <Image source={mapPhoto} style={styles.mapImage} resizeMode="cover" />
        <View style={styles.mapOverlay} />
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.listTitle}>Saved Location</Text>
        <Text style={styles.linkText}>Clear all</Text>
      </View>
      {[
        { title: "Computer Science Depart.", meta: "3.2 miles away - 12 mins ago", icon: "briefcase" },
        { title: "Home (Kwapong Hall)", meta: "5.2 miles away - 2 hours ago", icon: "home" },
        { title: "Poki Restaurant", meta: "9.2 miles away - Yesterday", icon: "coffee" }
      ].map((item) => (
        <Pressable key={item.title} onPress={() => navigation.navigate("EditLocation")} style={styles.listCard}>
          <View style={styles.listLeft}>
            <View style={styles.listIcon}>
              <Feather name={item.icon} size={16} color="#ffb6d7" />
            </View>
            <View>
              <Text style={styles.listItemTitle}>{item.title}</Text>
              <Text style={styles.listItemMeta}>{item.meta}</Text>
            </View>
          </View>
          <Text style={styles.listArrow}>&gt;</Text>
        </Pressable>
      ))}
    </View>
  </ScreenWrap>
);

const CompareRides = ({ navigation }) => (
  <ScreenWrap title="RideSync+" footer={<BottomNav navigation={navigation} active="home" />}>
    <View style={{ gap: 16 }}>
      <Text style={styles.homeGreeting}>
        Where to, <Text style={{ color: COLORS.fuchsia }}>Alexa</Text>?
      </Text>
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>PICKUP</Text>
        <View style={styles.inputPill}>
          <View style={styles.pillIcon}>
            <Text style={styles.pillIconText}>O</Text>
          </View>
          <Text style={styles.pillText}>123 Innovation Drive, Tech City</Text>
        </View>
        <Text style={[styles.sectionLabel, { marginTop: 14 }]}>DESTINATION</Text>
        <View style={[styles.inputPill, { opacity: 0.7 }]}>
          <View style={[styles.pillIcon, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
            <Text style={[styles.pillIconText, { color: "rgba(255,255,255,0.6)" }]}>X</Text>
          </View>
          <Text style={[styles.pillText, { color: "rgba(255,255,255,0.6)" }]}>Where are you heading?</Text>
        </View>
        <View style={{ marginTop: 16 }}>
          <PrimaryButton label="Compare Rides ->" onPress={() => navigation.navigate("RideMatch")} />
        </View>
      </View>
      <View style={styles.card}>
        <View style={styles.mapCard}>
          <Image source={mapPhoto} style={styles.mapImage} resizeMode="cover" />
          <View style={styles.mapOverlay} />
        </View>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.listTitle}>Saved Location</Text>
        <Text style={styles.linkText}>Clear all</Text>
      </View>
      {[
        { title: "Computer Science Depart.", meta: "3.2 miles away - 12 mins ago", icon: "briefcase" },
        { title: "Home (Kwapong Hall)", meta: "5.2 miles away - 2 hours ago", icon: "home" },
        { title: "Poki Restaurant", meta: "9.2 miles away - Yesterday", icon: "coffee" }
      ].map((item) => (
        <Pressable key={item.title} onPress={() => navigation.navigate("EditLocation")} style={styles.listCard}>
          <View style={styles.listLeft}>
            <View style={styles.listIcon}>
              <Feather name={item.icon} size={16} color="#ffb6d7" />
            </View>
            <View>
              <Text style={styles.listItemTitle}>{item.title}</Text>
              <Text style={styles.listItemMeta}>{item.meta}</Text>
            </View>
          </View>
          <Text style={styles.listArrow}>&gt;</Text>
        </Pressable>
      ))}
    </View>
  </ScreenWrap>
);

const RideMatch = ({ navigation }) => (
  <ScreenWrap title="RideSync+" footer={<BottomNav navigation={navigation} active="ride" />}>
    <View style={{ gap: 16 }}>
      <View>
        <Text style={styles.rideBrand}>RideSync+</Text>
        <Text style={styles.rideMeta}>To: 124 Madison Ave, NY</Text>
      </View>
      <View style={styles.alertCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.alertTitle}>Surge Pricing Active</Text>
          <Text style={styles.alertText}>
            Higher demand in East Legon. Prices and ETAs are slightly higher than usual.
          </Text>
        </View>
        <Text style={styles.alertClose}>x</Text>
      </View>
      <View style={styles.chipRow}>
        <View style={styles.chipActive}>
          <Text style={styles.chipActiveText}>Fastest</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>Cheapest</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>Comfort</Text>
        </View>
      </View>
      <View>
        <Text style={styles.sectionLabel}>BEST RECOMMENDATION</Text>
        <View style={styles.bestCard}>
          <View style={styles.bestTopRow}>
            <View>
              <Text style={styles.bestMeta}>UBERX - 4 mins away</Text>
              <Text style={styles.bestPrice}>GHS 24.50</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Top Rated</Text>
              </View>
              <Text style={styles.bestBrand}>UBER</Text>
            </View>
          </View>
          <View style={styles.bestBottomRow}>
            <View style={styles.driverRow}>
              <View style={styles.driverAvatar} />
              <View>
                <Text style={styles.driverName}>David L.</Text>
                <Text style={styles.driverMeta}>4.9 (2.4k trips)</Text>
              </View>
            </View>
            <PrimaryButton label="Book Now" style={styles.bookButton} />
          </View>
        </View>
      </View>
      <View>
        <Text style={styles.sectionLabel}>ALTERNATIVE RIDES</Text>
        {[
          { label: "Bolt Economy", price: "GHS 21.80", meta: "6 mins - 4.7", tag: "Economy", color: "#52e0c4" },
          { label: "Yango Comfort", price: "GHS 28.20", meta: "8 mins - 4.8", tag: "Economy", color: "#f7c35f" },
          { label: "Uber Black", price: "GHS 45.00", meta: "3 mins - 5.0", tag: "Comfort", color: "#b0b3c0" }
        ].map((ride) => (
          <View key={ride.label} style={styles.rideCard}>
            <View style={styles.rideLeft}>
              <View style={[styles.rideBadge, { backgroundColor: `${ride.color}20` }]}>
                <Text style={[styles.rideBadgeText, { color: ride.color }]}>{ride.label[0]}</Text>
              </View>
              <View>
                <Text style={styles.rideLabel}>{ride.label}</Text>
                <Text style={styles.rideMeta}>{ride.meta}</Text>
              </View>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.ridePrice}>{ride.price}</Text>
              <Text style={styles.rideTag}>{ride.tag}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  </ScreenWrap>
);

const RideDetails = ({ navigation }) => (
  <ScreenWrap title="Ride Details">
    <View style={{ gap: 16, flex: 1 }}>
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>LIVE MAP</Text>
        <View style={[styles.mapCard, { height: 120, marginTop: 12 }]}>
          <Image source={mapPhoto} style={styles.mapImage} resizeMode="cover" />
          <View style={styles.mapOverlay} />
        </View>
      </View>
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.listItemTitle}>UberX</Text>
            <Text style={styles.listItemMeta}>4 min away</Text>
          </View>
          <Text style={styles.priceText}>GHS 24.50</Text>
        </View>
        <View style={styles.rowBetweenSmall}>
          <Text style={styles.listItemMeta}>Pickup</Text>
          <Text style={styles.listItemMeta}>East Legon</Text>
        </View>
        <View style={styles.rowBetweenSmall}>
          <Text style={styles.listItemMeta}>Drop-off</Text>
          <Text style={styles.listItemMeta}>Airport</Text>
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>DRIVER INFO</Text>
        <View style={styles.driverRow}>
          <View style={styles.driverAvatar} />
          <View>
            <Text style={styles.listItemTitle}>Kevin Mensah</Text>
            <Text style={styles.listItemMeta}>4.9 (1,240)</Text>
          </View>
        </View>
      </View>
      <View style={{ marginTop: "auto" }}>
        <PrimaryButton label="Continue to App" onPress={() => navigation.navigate("Home")} />
      </View>
    </View>
  </ScreenWrap>
);

const Explore = ({ navigation }) => (
  <ScreenWrap title={null} scroll={false} contentStyle={{ paddingHorizontal: 0, paddingTop: 0 }} footer={<BottomNav navigation={navigation} active="map" />}>
    <View style={styles.exploreWrap}>
      <Image source={mapPhoto} style={styles.exploreMap} resizeMode="cover" />
      <View style={styles.exploreOverlay} />
      <View style={styles.exploreContent}>
        <View style={styles.explorePill}>
          <Text style={styles.explorePillText}>Explore Ride Conditions</Text>
        </View>
        <View style={styles.exploreSearch}>
          <Feather name="search" size={12} color={COLORS.fuchsia} />
          <Text style={styles.exploreSearchText}>Search destination or tap map</Text>
        </View>
        <View style={styles.exploreChips}>
          {["Home", "Work", "Airport"].map((chip) => (
            <View key={chip} style={styles.exploreChip}>
              <Text style={styles.exploreChipText}>{chip}</Text>
            </View>
          ))}
        </View>
        <View style={styles.exploreInfo}>
          <Text style={styles.exploreTitle}>Osu, Accra</Text>
          <Text style={styles.exploreMeta}>Oxford Street District</Text>
          <View style={styles.exploreRow}>
            <Text style={styles.exploreLabel}>Avg price</Text>
            <Text style={styles.exploreLabel}>ETA</Text>
          </View>
          <View style={styles.exploreRow}>
            <Text style={styles.exploreValue}>GHS 30</Text>
            <Text style={styles.exploreValue}>5-7 min</Text>
          </View>
          <PrimaryButton label="Compare Rides" style={{ marginTop: 10 }} onPress={() => navigation.navigate("CompareRides")} />
        </View>
        <View style={styles.exploreZoom}>
          <Pressable style={styles.exploreZoomBtn}>
            <Text style={styles.exploreZoomText}>+</Text>
          </Pressable>
          <Pressable style={styles.exploreZoomBtn}>
            <Text style={styles.exploreZoomText}>-</Text>
          </Pressable>
        </View>
        <View style={styles.exploreBanner}>
          <Text style={styles.exploreBannerText}>Best area nearby: East Legon (Cheapest rides now)</Text>
        </View>
      </View>
    </View>
  </ScreenWrap>
);

const History = ({ navigation }) => (
  <ScreenWrap title="History" footer={<BottomNav navigation={navigation} active="history" />}>
    <View style={{ gap: 16 }}>
      <View style={styles.rowBetween}>
        <View style={styles.rowCenter}>
          <Text style={styles.backArrow}>&lt;-</Text>
          <Text style={styles.sectionTitleSmall}>History</Text>
        </View>
        <View style={styles.filterPill}>
          <Text style={styles.filterPillText}>Last 30 Days</Text>
        </View>
      </View>
      {[
        {
          route: "East Legon -> Airport",
          time: "Oct 24, 10:30 AM - 12.4 km",
          price: "GHS 25",
          note: "Compared 3 platforms - Bolt was cheapest"
        },
        {
          route: "Osu -> Labadi Beach",
          time: "Oct 22, 06:15 PM - 6.2 km",
          price: "GHS 18",
          note: "Compared 2 platforms - Uber was fastest"
        }
      ].map((item) => (
        <View key={item.route} style={styles.card}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.listItemTitle}>{item.route}</Text>
              <Text style={styles.listItemMeta}>{item.time}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.smallLabel}>BEST OPTION</Text>
              <Text style={styles.priceText}>{item.price}</Text>
            </View>
          </View>
          <View style={styles.historyBadges}>
            {["U", "B", "Y"].map((tag, index) => (
              <View key={tag} style={[styles.historyBadge, index === 0 ? styles.historyBadgeGreen : index === 1 ? styles.historyBadgePink : styles.historyBadgeAmber]}>
                <Text style={styles.historyBadgeText}>{tag}</Text>
              </View>
            ))}
            <Text style={styles.listItemMeta}>{item.note}</Text>
          </View>
          <View style={styles.historyButtons}>
            <PrimaryButton label="Repeat Search" style={{ flex: 1 }} />
            <SecondaryButton label="Details" style={{ flex: 1 }} />
          </View>
        </View>
      ))}
      <View style={styles.historyEnd}>
        <View style={styles.historyEndCircle} />
        <Text style={styles.historyEndText}>End of History</Text>
        <Text style={styles.historyEndMeta}>Youve reached the end of your recent trips.</Text>
      </View>
    </View>
  </ScreenWrap>
);

const Profile = ({ navigation }) => (
  <ScreenWrap title="Profile" footer={<BottomNav navigation={navigation} active="profile" />}>
    <View style={{ gap: 16 }}>
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}>
          <View style={styles.profileStatus} />
        </View>
        <Text style={styles.profileName}>Alexa Johnson</Text>
        <Text style={styles.profileTag}>RIDESYNC+</Text>
        <PrimaryButton label="Edit Profile" style={{ marginTop: 10, width: 140 }} onPress={() => navigation.navigate("EditProfile")} />
      </View>
      <View>
        <Text style={styles.listTitle}>Ride Preferences</Text>
        <View style={{ gap: 12, marginTop: 10 }}>
          <View style={styles.prefRow}>
            <View style={styles.prefLeft}>
              <View style={styles.prefIcon}>
                <MaterialCommunityIcons name="car" size={16} color="#ffb6d7" />
              </View>
              <Text style={styles.prefLabel}>Prioritize Cost</Text>
            </View>
            <View style={styles.toggleOn}>
              <View style={styles.toggleKnob} />
            </View>
          </View>
          <View style={styles.prefRow}>
            <View style={styles.prefLeft}>
              <View style={[styles.prefIcon, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
                <Ionicons name="location" size={16} color="rgba(255,255,255,0.6)" />
              </View>
              <Text style={[styles.prefLabel, { color: "rgba(255,255,255,0.6)" }]}>Prioritize Time</Text>
            </View>
            <View style={styles.toggleOff}>
              <View style={styles.toggleKnobOff} />
            </View>
          </View>
        </View>
      </View>
      <View>
        <View style={styles.rowBetween}>
          <Text style={styles.listTitle}>Recent History</Text>
          <Pressable onPress={() => navigation.navigate("History")}>
            <Text style={styles.linkText}>View All</Text>
          </Pressable>
        </View>
        <View style={{ gap: 12, marginTop: 10 }}>
          {[
            { label: "Downtown to Airport", meta: "Yesterday, 4:30 PM - Uber vs Lyft", price: "GHS 24.50", tag: "Saved $5" },
            { label: "Office to Home", meta: "Oct 24 - Lyft Preferred", price: "GHS 18.20", tag: "Fastest" },
            { label: "Office to Home", meta: "Oct 24 - Lyft Preferred", price: "GHS 18.20", tag: "Fastest" }
          ].map((item) => (
            <View key={`${item.label}-${item.price}`} style={styles.listCard}>
              <View style={styles.listLeft}>
                <View style={styles.listIcon}>
                  <Ionicons name="location" size={16} color="#ffb6d7" />
                </View>
                <View>
                  <Text style={styles.listItemTitle}>{item.label}</Text>
                  <Text style={styles.listItemMeta}>{item.meta}</Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.priceText}>{item.price}</Text>
                <Text style={styles.listItemMeta}>{item.tag}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  </ScreenWrap>
);

const EditProfile = ({ navigation }) => (
  <ScreenWrap title="Edit Profile" footer={<BottomNav navigation={navigation} active="profile" />}>
    <View style={{ gap: 16 }}>
      <View style={styles.rowCenter}>
        <Text style={styles.backArrow}>&lt;-</Text>
        <Text style={styles.sectionTitleSmall}>Edit Profile</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.profileEditHeader}>
          <View style={styles.profileAvatar}>
            <View style={styles.profileEditBadge}>
              <Text style={styles.profileEditBadgeText}>EDIT</Text>
            </View>
          </View>
          <Text style={styles.listItemTitle}>Alexa Johnson</Text>
          <Text style={styles.listItemMeta}>alexa@ridesync.com</Text>
        </View>
        <View style={{ gap: 12, marginTop: 12 }}>
          {[
            { label: "FULL NAME", value: "Alexa Johnson" },
            { label: "EMAIL ADDRESS", value: "alexa@ridesync.com" },
            { label: "PHONE NUMBER", value: "+233 24 123 4567" },
            { label: "LOCATION", value: "Accra, Ghana" }
          ].map((field) => (
            <View key={field.label}>
              <Text style={styles.sectionLabel}>{field.label}</Text>
              <TextInput defaultValue={field.value} style={styles.input} placeholderTextColor="rgba(255,255,255,0.4)" />
            </View>
          ))}
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.listTitle}>Ride Preferences</Text>
        <View style={styles.prefChipRow}>
          <View style={styles.chipActive}><Text style={styles.chipActiveText}>Fastest</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>Comfort</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>Cheapest</Text></View>
        </View>
        <View style={styles.prefToggleRow}>
          <Text style={styles.smallText}>Price alerts</Text>
          <View style={styles.toggleOn} />
        </View>
        <View style={styles.prefToggleRow}>
          <Text style={styles.smallText}>Night alerts</Text>
          <View style={styles.toggleOff} />
        </View>
      </View>
      <PrimaryButton label="Save Changes" onPress={() => navigation.goBack()} />
    </View>
  </ScreenWrap>
);

const EditLocation = ({ navigation }) => (
  <ScreenWrap title="Edit Location">
    <View style={{ gap: 16, flex: 1 }}>
      <View style={styles.card}>
        <Text style={styles.listItemTitle}>Edit Location</Text>
        <Text style={styles.listItemMeta}>Update your saved place for quicker booking</Text>
        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>LOCATION LABEL</Text>
        <TextInput defaultValue="Home" style={styles.input} placeholderTextColor="rgba(255,255,255,0.4)" />
        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>ADDRESS</Text>
        <TextInput defaultValue="742 Evergreen Terrace, Springfield" style={styles.input} placeholderTextColor="rgba(255,255,255,0.4)" />
        <View style={[styles.card, { marginTop: 16 }]}>
          <View style={[styles.mapCard, { height: 100 }]}>
            <Image source={mapPhoto} style={styles.mapImage} resizeMode="cover" />
            <View style={styles.mapOverlay} />
          </View>
          <SecondaryButton label="Change Map" style={{ marginTop: 10 }} />
        </View>
      </View>
      <View style={{ marginTop: "auto" }}>
        <PrimaryButton label="Save Changes" onPress={() => navigation.navigate("Home")} />
      </View>
    </View>
  </ScreenWrap>
);

const Insights = ({ navigation }) => (
  <ScreenWrap title="Insights" footer={<BottomNav navigation={navigation} active="insights" />}>
    <View style={{ gap: 16 }}>
      <View style={styles.rowCenter}>
        <Text style={styles.backArrow}>&lt;-</Text>
        <Text style={styles.sectionTitleSmall}>Insights</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.smallText}>Daily Ride Trends</Text>
          <View style={styles.greenBadge}>
            <Text style={styles.greenBadgeText}>+12% Traffic</Text>
          </View>
        </View>
        <Text style={styles.sectionTitle}>Peak: 8:00 AM</Text>
        <View style={styles.trendBox}>
          <View style={styles.trendLine} />
          <View style={styles.trendLabels}>
            {["6AM", "12PM", "6PM", "12AM"].map((label) => (
              <Text key={label} style={styles.trendLabel}>{label}</Text>
            ))}
          </View>
        </View>
      </View>
      <View style={styles.bestTimeCard}>
        <Text style={styles.sectionLabel}>BEST TIME TO RIDE</Text>
        <Text style={styles.bestTimeTitle}>10:30 AM - 3:00 PM</Text>
        <Text style={styles.bestTimeText}>Lowest traffic and average 15% fare reduction in Accra.</Text>
        <MaterialCommunityIcons name="car" size={80} color="rgba(255,255,255,0.2)" style={styles.bestTimeIcon} />
      </View>
      <View>
        <View style={styles.rowCenter}>
          <Text style={styles.triangle}>^</Text>
          <Text style={styles.sectionTitleSmall}>Surge Pricing Alerts</Text>
        </View>
        <View style={{ gap: 12, marginTop: 10 }}>
          <View style={[styles.card, { borderColor: COLORS.fuchsiaBorder }]}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.listItemTitle}>Osu & Airport City</Text>
                <Text style={styles.listItemMeta}>High demand due to events</Text>
              </View>
              <Text style={styles.priceText}>2.1x</Text>
            </View>
          </View>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.listItemTitle}>Kwame Nkrumah Circle</Text>
                <Text style={styles.listItemMeta}>Moderate congestion</Text>
              </View>
              <Text style={styles.listItemMeta}>1.4x</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>PRICE COMPARISON (GHS)</Text>
        <View style={{ gap: 12, marginTop: 12 }}>
          {[
            { label: "Uber", value: "GHS 42.00 avg", width: "90%" },
            { label: "Bolt", value: "GHS 35.50 avg", width: "75%" },
            { label: "Yango", value: "GHS 38.00 avg", width: "82%" }
          ].map((item) => (
            <View key={item.label}>
              <View style={styles.rowBetween}>
                <Text style={styles.listItemMeta}>{item.label}</Text>
                <Text style={styles.listItemMeta}>{item.value}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: item.width }]} />
              </View>
            </View>
          ))}
        </View>
        <View style={styles.tipCard}>
          <Ionicons name="location" size={14} color="#ffb6d7" />
          <Text style={styles.tipText}>Smart Tip: Bolt is currently the most affordable option in East Legon.</Text>
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.listTitle}>Popular Routes</Text>
        <View style={{ gap: 10, marginTop: 12 }}>
          {[
            { id: 1, route: "East Legon -> Airport", time: "15 min - Every 4 mins" },
            { id: 2, route: "Madina -> Circle", time: "32 min - High Demand" },
            { id: 3, route: "Osu -> Tema", time: "45 min - Morning Peak" }
          ].map((route) => (
            <View key={route.id} style={styles.popularRow}>
              <View style={styles.popularLeft}>
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>{route.id}</Text>
                </View>
                <View>
                  <Text style={styles.listItemTitle}>{route.route}</Text>
                  <Text style={styles.listItemMeta}>{route.time}</Text>
                </View>
              </View>
              <Text style={styles.listArrow}>&gt;</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.listTitle}>Demand Map</Text>
        <View style={styles.demandBox}>
          <View style={styles.demandGlow} />
          <View style={styles.demandPin}>
            <Ionicons name="location" size={16} color="#fff" />
          </View>
        </View>
        <Text style={styles.demandTitle}>Accra Central</Text>
        <Text style={styles.demandMeta}>Live demand</Text>
      </View>
    </View>
  </ScreenWrap>
);

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: COLORS.bg }
        }}
      >
        <Stack.Screen name="Splash" component={Splash} />
        <Stack.Screen name="OnboardingCompare" component={(props) => (
          <OnboardingTemplate
            {...props}
            title="Compare & Save"
            subtitle="Find the best prices across Uber, Bolt, and Yango in seconds."
            next="OnboardingFavorites"
            buttonLabel="Next ->"
            showSkip
            hero="compare"
          />
        )} />
        <Stack.Screen name="OnboardingFavorites" component={(props) => (
          <OnboardingTemplate
            {...props}
            title="Save Your Favorite Places"
            subtitle="Find the best prices across Uber, Bolt, and Yango in seconds."
            next="OnboardingInsights"
            buttonLabel="Next ->"
            showSkip
            hero="favorites"
          />
        )} />
        <Stack.Screen name="OnboardingInsights" component={(props) => (
          <OnboardingTemplate
            {...props}
            title="Make Smarter Travel Decisions"
            subtitle="Find the best prices across Uber, Bolt, and Yango in seconds."
            next="Login"
            buttonLabel="Get Started"
            showSkip={false}
            hero="insights"
          />
        )} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="Loading" component={Loading} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="CompareRides" component={CompareRides} />
        <Stack.Screen name="RideMatch" component={RideMatch} />
        <Stack.Screen name="RideDetails" component={RideDetails} />
        <Stack.Screen name="Explore" component={Explore} />
        <Stack.Screen name="History" component={History} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
        <Stack.Screen name="EditLocation" component={EditLocation} />
        <Stack.Screen name="Insights" component={Insights} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 20,
    paddingTop: 10
  },
  screenTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 6
  },
  scrollContent: {
    paddingBottom: 120
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0
  },
  primaryButton: {
    height: 44,
    borderRadius: 999,
    backgroundColor: COLORS.fuchsia,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.fuchsia,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }
  },
  primaryButtonPressed: {
    opacity: 0.85
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    letterSpacing: 0.2
  },
  secondaryButton: {
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card
  },
  secondaryButtonPressed: {
    opacity: 0.8
  },
  secondaryButtonText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "600"
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 18,
    paddingTop: 14,
    backgroundColor: "#220b15"
  },
  bottomNavItem: {
    flex: 1,
    alignItems: "center",
    gap: 6
  },
  bottomNavLabel: {
    fontSize: 9,
    letterSpacing: 2,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600"
  },
  bottomNavLabelActive: {
    color: COLORS.fuchsia
  },
  bottomNavCenter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.fuchsia,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -30,
    shadowColor: COLORS.fuchsia,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 }
  },
  bottomNavCenterInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2a0f1c",
    alignItems: "center",
    justifyContent: "center"
  },
  heroWrap: {
    width: 240,
    height: 240,
    alignItems: "center",
    justifyContent: "center"
  },
  heroShadow: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
    backgroundColor: "rgba(255,79,154,0.35)",
    transform: [{ translateX: 6 }, { translateY: 10 }, { rotate: "5deg" }],
    opacity: 0.6
  },
  heroRotate: {
    width: 240,
    height: 240,
    transform: [{ rotate: "-7.5deg" }]
  },
  heroCard: {
    flex: 1,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
    backgroundColor: "rgba(42,15,28,0.35)"
  },
  heroMapInset: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "rgba(58,20,38,0.7)"
  },
  heroMapImage: {
    width: "100%",
    height: "100%",
    opacity: 0.7
  },
  heroMapTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,79,154,0.15)"
  },
  heroPinOuter: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,79,154,0.3)",
    top: "42%",
    left: "50%",
    marginLeft: -10
  },
  heroPinInner: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.fuchsia,
    top: "39%",
    left: "50%",
    marginLeft: -7
  },
  heroPinRing: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(255,79,154,0.7)",
    top: "37%",
    left: "50%",
    marginLeft: -10
  },
  heroPricePill: {
    position: "absolute",
    left: "50%",
    bottom: 24,
    transform: [{ translateX: -88 }],
    width: 176,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,79,154,0.3)",
    backgroundColor: "rgba(42,15,28,0.7)"
  },
  heroPriceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  heroCarBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,79,154,0.2)",
    alignItems: "center",
    justifyContent: "center"
  },
  heroPriceLine: {
    width: 32,
    height: 6,
    borderRadius: 4,
    backgroundColor: "rgba(255,79,154,0.5)"
  },
  heroPriceText: {
    color: "#ffd2e7",
    fontSize: 10,
    fontWeight: "600"
  },
  heroFavoritesPin: {
    position: "absolute",
    top: 32,
    left: "50%",
    marginLeft: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,79,154,0.2)",
    alignItems: "center",
    justifyContent: "center"
  },
  heroFavRow: {
    position: "absolute",
    top: 110,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18
  },
  heroFavItem: {
    alignItems: "center",
    gap: 4
  },
  heroFavIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,79,154,0.2)",
    alignItems: "center",
    justifyContent: "center"
  },
  heroFavLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10
  },
  heroFavMeta: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9
  },
  heroInsightsCard: {
    padding: 18
  },
  heroInsightsHeader: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  heroInsightsLabel: {
    color: "#ffb6d7",
    fontSize: 8,
    letterSpacing: 2,
    fontWeight: "600"
  },
  heroInsightsValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4
  },
  heroInsightsMeta: {
    color: "#6ee7b7",
    fontSize: 9
  },
  heroInsightsIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,79,154,0.2)",
    alignItems: "center",
    justifyContent: "center"
  },
  heroSmartCard: {
    position: "absolute",
    left: -18,
    top: 110,
    width: 276,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
    backgroundColor: "rgba(42,15,28,0.55)",
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  heroStars: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.fuchsia,
    alignItems: "center",
    justifyContent: "center"
  },
  heroSmartText: {
    flex: 1,
    paddingLeft: 6
  },
  heroSmartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  heroSmartTitle: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600"
  },
  heroSmartArrow: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12
  },
  heroSmartMeta: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 9,
    marginTop: 4
  },
  heroInsightsPin: {
    position: "absolute",
    bottom: 22,
    right: 22,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,79,154,0.2)",
    alignItems: "center",
    justifyContent: "center"
  },
  onboardingContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: "space-between",
    flex: 1
  },
  onboardingHeader: {
    alignItems: "center",
    justifyContent: "center",
    height: 24
  },
  onboardingClose: {
    position: "absolute",
    left: 0
  },
  onboardingCloseText: {
    color: COLORS.fuchsia,
    fontSize: 18
  },
  onboardingBrand: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "600"
  },
  onboardingBody: {
    alignItems: "center"
  },
  onboardingTitle: {
    marginTop: 24,
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center"
  },
  onboardingSubtitle: {
    marginTop: 8,
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    maxWidth: 240
  },
  onboardingFooter: {
    alignItems: "center",
    gap: 12
  },
  onboardingDots: {
    flexDirection: "row",
    gap: 8
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.2)"
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.fuchsia
  },
  skipText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.fuchsia,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 }
  },
  splashTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff"
  },
  splashSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)"
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff"
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 6
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#fff"
  },
  linkText: {
    color: COLORS.fuchsia,
    fontSize: 12,
    textAlign: "right"
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)"
  },
  dividerText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)"
  },
  socialRow: {
    flexDirection: "row",
    gap: 10
  },
  centeredRow: {
    flexDirection: "row",
    justifyContent: "center"
  },
  smallText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11
  },
  loadingBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.fuchsia,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 }
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff"
  },
  loadingDots: {
    flexDirection: "row",
    gap: 8
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  loadingText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)"
  },
  homeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  homeBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  homeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center"
  },
  homeBrandText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12
  },
  homeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)"
  },
  homeGreeting: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff"
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: 16
  },
  sectionLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600"
  },
  inputPill: {
    marginTop: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  pillIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center"
  },
  pillIconText: {
    color: "#ffb6d7",
    fontSize: 16
  },
  pillText: {
    color: "#fff",
    fontSize: 12
  },
  mapCard: {
    height: 170,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative"
  },
  mapImage: {
    width: "100%",
    height: "100%"
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,79,154,0.15)"
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  rowBetweenSmall: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  listTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600"
  },
  listCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  listLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  listIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center"
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff"
  },
  listItemMeta: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)"
  },
  listArrow: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14
  },
  rideBrand: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14
  },
  rideMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10
  },
  alertCard: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: 12
  },
  alertTitle: {
    color: "#ffb6d7",
    fontSize: 11
  },
  alertText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 9,
    marginTop: 4
  },
  alertClose: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14
  },
  chipRow: {
    flexDirection: "row",
    gap: 8
  },
  chipActive: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.fuchsiaSoft
  },
  chipActiveText: {
    color: "#ffb6d7",
    fontSize: 10,
    fontWeight: "600"
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)"
  },
  chipText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10
  },
  bestCard: {
    marginTop: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: 16
  },
  bestTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  bestMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10
  },
  bestPrice: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4
  },
  bestBrand: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8
  },
  badge: {
    borderRadius: 999,
    backgroundColor: COLORS.fuchsiaSoft,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  badgeText: {
    color: "#ffb6d7",
    fontSize: 9,
    fontWeight: "600"
  },
  bestBottomRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  driverAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)"
  },
  driverName: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600"
  },
  driverMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 9
  },
  bookButton: {
    width: 90,
    height: 32,
    borderRadius: 999
  },
  rideCard: {
    marginTop: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  rideLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  rideBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  rideBadgeText: {
    fontSize: 12,
    fontWeight: "700"
  },
  rideLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  },
  rideMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 9
  },
  ridePrice: {
    color: COLORS.fuchsia,
    fontSize: 12,
    fontWeight: "700"
  },
  rideTag: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9
  },
  priceText: {
    color: COLORS.fuchsia,
    fontSize: 14,
    fontWeight: "700"
  },
  exploreWrap: {
    flex: 1,
    backgroundColor: "#000"
  },
  exploreMap: {
    width: "100%",
    height: "100%"
  },
  exploreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)"
  },
  exploreContent: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 20,
    paddingTop: 40
  },
  explorePill: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)"
  },
  explorePillText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600"
  },
  exploreSearch: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)"
  },
  exploreSearchText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10
  },
  exploreChips: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center"
  },
  exploreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)"
  },
  exploreChipText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10
  },
  exploreInfo: {
    marginTop: 20,
    alignSelf: "center",
    width: "80%",
    borderRadius: 24,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.65)"
  },
  exploreTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
    textAlign: "center"
  },
  exploreMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    textAlign: "center",
    marginTop: 2
  },
  exploreRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  exploreLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10
  },
  exploreValue: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  },
  exploreZoom: {
    position: "absolute",
    right: 16,
    top: "45%",
    gap: 8
  },
  exploreZoomBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center"
  },
  exploreZoomText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14
  },
  exploreBanner: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 120,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.65)"
  },
  exploreBannerText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    textAlign: "center"
  },
  backArrow: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14
  },
  sectionTitleSmall: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600"
  },
  filterPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  filterPillText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "600"
  },
  smallLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9
  },
  historyBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10
  },
  historyBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  historyBadgeGreen: {
    backgroundColor: "rgba(52,211,153,0.2)"
  },
  historyBadgePink: {
    backgroundColor: "rgba(255,79,154,0.2)"
  },
  historyBadgeAmber: {
    backgroundColor: "rgba(251,191,36,0.2)"
  },
  historyBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "600"
  },
  historyButtons: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10
  },
  historyEnd: {
    marginTop: 12,
    alignItems: "center",
    gap: 6
  },
  historyEndCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.border
  },
  historyEndText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12
  },
  historyEndMeta: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10
  },
  profileHeader: {
    alignItems: "center"
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.1)"
  },
  profileStatus: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.bg,
    backgroundColor: COLORS.fuchsia
  },
  profileName: {
    marginTop: 10,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },
  profileTag: {
    color: COLORS.fuchsia,
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: "600",
    marginTop: 4
  },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  prefLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  prefIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center"
  },
  prefLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12
  },
  toggleOn: {
    width: 40,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,79,154,0.7)",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 3
  },
  toggleKnob: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#fff"
  },
  toggleOff: {
    width: 40,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 3
  },
  toggleKnobOff: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.7)"
  },
  profileEditHeader: {
    alignItems: "center"
  },
  profileEditBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.fuchsia,
    alignItems: "center",
    justifyContent: "center"
  },
  profileEditBadgeText: {
    fontSize: 8,
    color: "#fff",
    fontWeight: "600"
  },
  prefChipRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10
  },
  prefToggleRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  trendBox: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: "#1f0b14",
    padding: 12
  },
  trendLine: {
    height: 60,
    borderRadius: 12,
    backgroundColor: "rgba(255,79,154,0.1)"
  },
  trendLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8
  },
  trendLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9
  },
  greenBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(52,211,153,0.2)"
  },
  greenBadgeText: {
    color: "#6ee7b7",
    fontSize: 9,
    fontWeight: "600"
  },
  bestTimeCard: {
    borderRadius: 24,
    backgroundColor: COLORS.fuchsia,
    padding: 16,
    overflow: "hidden"
  },
  bestTimeTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 6
  },
  bestTimeText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 6
  },
  bestTimeIcon: {
    position: "absolute",
    right: -10,
    bottom: -10
  },
  triangle: {
    color: COLORS.fuchsia,
    fontSize: 10
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginTop: 6
  },
  progressFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.fuchsia
  },
  tipCard: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: COLORS.fuchsiaSoft,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    gap: 8,
    alignItems: "center"
  },
  tipText: {
    color: "#ffb6d7",
    fontSize: 10,
    flex: 1
  },
  popularRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  popularLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  popularBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center"
  },
  popularBadgeText: {
    color: "#ffb6d7",
    fontSize: 10,
    fontWeight: "600"
  },
  demandBox: {
    marginTop: 12,
    height: 120,
    borderRadius: 20,
    backgroundColor: "#1f0b14",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  demandGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,79,154,0.3)",
    opacity: 0.9
  },
  demandPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.fuchsia,
    alignItems: "center",
    justifyContent: "center"
  },
  demandTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8
  },
  demandMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    textAlign: "center"
  }
});
