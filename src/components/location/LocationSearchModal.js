/**
 * components/location/LocationSearchModal.js
 * ───────────────────────────────────────────
 * Bottom-sheet style place picker backed by the Google-Maps autocomplete +
 * place-details endpoints. Returns a fully resolved { address, lat, lng }.
 *
 * Autocomplete and the follow-up place-details lookup share one session token
 * so Google bills them as a single session.
 */
import React, { useEffect, useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

import { COLORS } from "../../theme/colors";
import { ms } from "../../utils/responsive";
import { useDebounce } from "../../hooks/useDebounce";
import { locationsService } from "../../services";

function newSessionToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const LocationSearchModal = ({ visible, title = "Search location", onClose, onSelect }) => {
  const [query, setQuery] = useState("");
  const [sessionToken, setSessionToken] = useState(newSessionToken);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState(null);

  const debouncedQuery = useDebounce(query, 300);

  // Reset state each time the sheet opens.
  useEffect(() => {
    if (visible) {
      setQuery("");
      setSuggestions([]);
      setError(null);
      setSessionToken(newSessionToken());
    }
  }, [visible]);

  useEffect(() => {
    let cancelled = false;
    const q = debouncedQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    setError(null);
    locationsService
      .autocomplete(q, { sessionToken })
      .then((results) => {
        if (!cancelled) setSuggestions(results);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Couldn't load suggestions.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, sessionToken]);

  const handleSelect = useCallback(
    async (suggestion) => {
      setResolving(true);
      setError(null);
      try {
        const place = await locationsService.placeDetails(suggestion.placeId);
        onSelect({ address: place.address, lat: place.lat, lng: place.lng });
        onClose();
      } catch (err) {
        setError(err?.message || "Couldn't resolve that place.");
      } finally {
        setResolving(false);
      }
    },
    [onSelect, onClose]
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Feather name="x" size={ms(20)} color={COLORS.text} />
            </Pressable>
          </View>

          <View style={styles.searchBox}>
            <Feather name="search" size={ms(16)} color={COLORS.fuchsia} />
            <TextInput
              autoFocus
              placeholder="Search a place in Ghana"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
            />
            {loading ? <ActivityIndicator color={COLORS.fuchsia} /> : null}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.placeId}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            ListEmptyComponent={
              query.trim().length >= 2 && !loading ? (
                <Text style={styles.empty}>No matches found.</Text>
              ) : (
                <Text style={styles.hint}>Start typing to search…</Text>
              )
            }
            renderItem={({ item }) => (
              <Pressable style={styles.row} onPress={() => handleSelect(item)} disabled={resolving}>
                <View style={styles.rowIcon}>
                  <Ionicons name="location" size={ms(15)} color="#ffb6d7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowMain} numberOfLines={1}>
                    {item.mainText}
                  </Text>
                  {item.secondaryText ? (
                    <Text style={styles.rowSecondary} numberOfLines={1}>
                      {item.secondaryText}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            )}
          />

          {resolving ? (
            <View style={styles.resolving}>
              <ActivityIndicator color={COLORS.fuchsia} />
              <Text style={styles.hint}>Getting location…</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#1c0a13",
    borderTopLeftRadius: ms(28),
    borderTopRightRadius: ms(28),
    paddingHorizontal: ms(20),
    paddingTop: ms(10),
    paddingBottom: ms(28),
    maxHeight: "82%",
    minHeight: "55%",
  },
  handle: {
    alignSelf: "center",
    width: ms(40),
    height: ms(4),
    borderRadius: ms(2),
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: ms(12),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: ms(12),
  },
  title: {
    color: "#fff",
    fontSize: ms(15),
    fontWeight: "600",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(10),
    borderRadius: ms(999),
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingHorizontal: ms(16),
    paddingVertical: ms(10),
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: ms(13),
  },
  list: {
    marginTop: ms(12),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(12),
    paddingVertical: ms(12),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  rowIcon: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowMain: {
    color: "#fff",
    fontSize: ms(13),
    fontWeight: "600",
  },
  rowSecondary: {
    color: "rgba(255,255,255,0.5)",
    fontSize: ms(10),
    marginTop: ms(2),
  },
  error: {
    color: "#ffd2e7",
    fontSize: ms(11),
    marginTop: ms(10),
  },
  empty: {
    color: "rgba(255,255,255,0.5)",
    fontSize: ms(12),
    textAlign: "center",
    paddingVertical: ms(24),
  },
  hint: {
    color: "rgba(255,255,255,0.4)",
    fontSize: ms(11),
    textAlign: "center",
    paddingVertical: ms(16),
  },
  resolving: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ms(8),
  },
});

export default LocationSearchModal;
