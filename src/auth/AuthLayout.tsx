import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { theme } from '../../src/theme';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  footer: React.ReactNode;
  showLogo?: boolean;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  footer,
  showLogo = false,
}) => {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContainer}>
          <View style={styles.headerContainer}>
            {showLogo && (
              <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
            )}
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>

          <View style={styles.formContainer}>{children}</View>

          <View style={styles.footerContainer}>{footer}</View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing['level-6'],
    backgroundColor: theme.colors.background2,
    width: '100%',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing['level-6'],
  },
  logo: {
    width: 200,
    height: 100,
    resizeMode: 'contain',
    marginBottom: theme.spacing['level-6'],
  },
  title: {
    fontSize: theme.typography.fontSize['level-8'],
    fontWeight: theme.typography.fontWeight['bold'],
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: theme.typography.fontSize['level-4'],
    color: theme.colors.textSecondary,
    marginTop: theme.spacing['level-2'],
  },
  formContainer: {
    width: '100%',
  },
  footerContainer: {
    marginTop: theme.spacing['level-4'],
  },
});

export default AuthLayout;