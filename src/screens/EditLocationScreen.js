/**
 * screens/EditLocationScreen.js
 * ──────────────────────────────
 * Edit a saved place: label, address and map preview.
 */
import React from "react";
import { View, Text, TextInput, Image } from "react-native";

import { ScreenWrap } from "../components/layout";
import { PrimaryButton, SecondaryButton } from "../components/Button";
import { commonStyles } from "../theme/commonStyles";
import { ms } from "../utils/responsive";
import { mapPhoto } from "../constants/assets";
import { ROUTES } from "../navigation/routes";

export const EditLocationScreen = ({ navigation }) => (
  <ScreenWrap title="Edit Location">
    <View style={{ gap: ms(16), flex: 1 }}>
      <View style={commonStyles.card}>
        <Text style={commonStyles.listItemTitle}>Edit Location</Text>
        <Text style={commonStyles.listItemMeta}>Update your saved place for quicker booking</Text>
        <Text style={[commonStyles.sectionLabel, { marginTop: ms(16) }]}>LOCATION LABEL</Text>
        <TextInput defaultValue="Home" style={commonStyles.input} placeholderTextColor="rgba(255,255,255,0.4)" />
        <Text style={[commonStyles.sectionLabel, { marginTop: ms(16) }]}>ADDRESS</Text>
        <TextInput defaultValue="742 Evergreen Terrace, Springfield" style={commonStyles.input} placeholderTextColor="rgba(255,255,255,0.4)" />
        <View style={[commonStyles.card, { marginTop: ms(16) }]}>
          <View style={[commonStyles.mapCard, { height: ms(100) }]}>
            <Image source={mapPhoto} style={commonStyles.mapImage} resizeMode="cover" />
            <View style={commonStyles.mapOverlay} />
          </View>
          <SecondaryButton label="Change Map" style={{ marginTop: ms(10) }} />
        </View>
      </View>
      <View style={{ marginTop: "auto" }}>
        <PrimaryButton label="Save Changes" onPress={() => navigation.navigate(ROUTES.HOME)} />
      </View>
    </View>
  </ScreenWrap>
);

export default EditLocationScreen;
