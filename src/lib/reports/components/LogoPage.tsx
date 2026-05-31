import { Page, View, Image, StyleSheet } from "@react-pdf/renderer";
import { baseStyles } from "../theme";
import { Logo } from "./Logo";

interface LogoPageProps {
  logoBase64?: string;
}

const styles = StyleSheet.create({
  page: {
    ...baseStyles.page,
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    height: 240,
  },
});

export function LogoPage({ logoBase64 }: LogoPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <View>
        {logoBase64 ? (
          <Image src={logoBase64} style={styles.logoImage} />
        ) : (
          <Logo size={140} />
        )}
      </View>
    </Page>
  );
}
