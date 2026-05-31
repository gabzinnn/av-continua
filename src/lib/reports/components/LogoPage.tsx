import { Page, View, StyleSheet } from "@react-pdf/renderer";
import { baseStyles } from "../theme";
import { Logo } from "./Logo";

const styles = StyleSheet.create({
  page: {
    ...baseStyles.page,
    justifyContent: "center",
    alignItems: "center",
  },
});

export function LogoPage() {
  return (
    <Page size="A4" style={styles.page}>
      <View>
        <Logo size={140} />
      </View>
    </Page>
  );
}
