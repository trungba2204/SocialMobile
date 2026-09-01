import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ChatScreen } from '@/features/messages/ChatScreen';
import { listMessages } from '@/features/messages/messagesData';

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: mockGoBack }),
  useRoute: () => ({ params: { conversationId: 'c-maya' } }),
}));

const metrics = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

async function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider>
        <ChatScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('ChatScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the seeded mock messages for the conversation id', async () => {
    const { getByText } = await renderScreen();
    const seeded = listMessages('c-maya');
    await waitFor(() => expect(getByText(seeded[0]!.text)).toBeTruthy());
    expect(getByText('Maya Okafor')).toBeTruthy();
  });

  it('typing and sending appends a right-aligned bubble with the typed text and clears the composer', async () => {
    const { getByPlaceholderText, getByLabelText, getByText, queryByText } = await renderScreen();

    expect(queryByText('On my way now')).toBeNull();

    await fireEvent.changeText(getByPlaceholderText('Message'), 'On my way now');
    await fireEvent.press(getByLabelText('Send message'));

    await waitFor(() => expect(getByText('On my way now')).toBeTruthy());

    // composer cleared
    expect(getByPlaceholderText('Message').props.value).toBe('');

    // bubble wrapper is right-aligned (mine)
    const wrap = getByText('On my way now').parent!.parent!;
    expect(StyleSheet.flatten(wrap.props.style).alignItems).toBe('flex-end');
  });
});
