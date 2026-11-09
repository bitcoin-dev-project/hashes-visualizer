import React from 'react';
import { createHash } from 'crypto';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import SHA256Page from './SHA256';
import { sha256Bytes } from '../lib/sha256';
import { COLLISION_MESSAGES, FULL_DIGESTS, REDUCED_38_DIGEST, REDUCED_38_BLOCK_2 } from '../testFixtures/sha256Collision';

const ABC_HASH = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
// Independent compression checkpoints for the padded "abc" block, after
// adding the working state back to the initial hash words.
const ABC_ROUNDS = {
  1: 'c774d234257194ecf7d6a1f7e1bee8ac4b3898a1ec13bb0bba8942377b64a6c4',
  43: '81b3f4659aae13b412d5fad81f3a5db42fdb99941e908f9d45b9070e7adc8db9',
  44: '075595fad311bc831bb558a17bb6fca04eb09ead79d2afa1a30f00bc8215fa7c',
  45: '906c6e7c58b35e185419017084965a69f91d646f98a7b4bafe5120c0df6bf42a',
  63: '3da407ccc039fbf1f4cd205b5bfe85394c20648f2f928e42b5a3223f0dfc7a56',
  64: ABC_HASH,
};

function setup(message = 'abc') {
  render(<HelmetProvider><SHA256Page /></HelmetProvider>);
  fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: message } });
}

function chooseRound(round) {
  fireEvent.change(screen.getByLabelText('Round'), { target: { value: String(round) } });
}

function clickControl(title) {
  fireEvent.click(screen.getAllByTitle(title).slice(-1)[0]);
}

beforeEach(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

test('shows the exact result after 44 rounds and keeps stepping in sync', () => {
  setup();
  chooseRound(44);
  const result = screen.getByRole('region', { name: 'Compression result' });
  expect(screen.getByTestId('sha256-working-state')).not.toBeVisible();
  fireEvent.click(within(result).getByTitle('Result details'));
  expect(screen.getByTestId('sha256-working-state')).toBeVisible();
  expect(screen.getByTestId('sha256-round-result')).toHaveTextContent(ABC_ROUNDS[44]);
  expect(screen.getByTestId('sha256-working-state')).toHaveTextContent(
    '9d4baf9317aa0dfedf46652fd6670766fda24c2edecd4715838b271126352d63'
  );
  expect(result).toHaveTextContent('SHA-256 requires all 64 rounds of every block');
  expect(screen.queryByTestId('sha256-final-hash')).not.toBeInTheDocument();
  expect(screen.getByText('Round 44 of 64')).toBeVisible();
  expect(screen.getByText(/using k43/)).toBeVisible();

  clickControl('Step forward');
  expect(screen.getByLabelText('Round')).toHaveValue('45');
  expect(screen.getByTestId('sha256-round-result')).toHaveTextContent(ABC_ROUNDS[45]);
  clickControl('Step back');
  expect(screen.getByTestId('sha256-round-result')).toHaveTextContent(ABC_ROUNDS[44]);
  clickControl('Step back');
  expect(screen.getByTestId('sha256-round-result')).toHaveTextContent(ABC_ROUNDS[43]);

  chooseRound(0);
  expect(screen.queryByTestId('sha256-round-result')).not.toBeInTheDocument();
  clickControl('Step forward');
  expect(screen.getByLabelText('Round')).toHaveValue('1');
  expect(screen.getByTestId('sha256-round-result')).toHaveTextContent(ABC_ROUNDS[1]);
  chooseRound(63);
  expect(screen.getByTestId('sha256-round-result')).toHaveTextContent(ABC_ROUNDS[63]);
  clickControl('Step forward');
  expect(screen.getByLabelText('Round')).toHaveValue('64');
  expect(screen.getByText('Round 64 of 64')).toBeVisible();
  expect(screen.getByTestId('sha256-round-result')).toHaveTextContent(ABC_HASH);
  for (let i = 0; i < 4; i++) clickControl('Step forward');
  expect(screen.getByTestId('sha256-final-hash')).toHaveTextContent(ABC_HASH);
  clickControl('Reset');
  expect(screen.getByLabelText('Round')).toHaveValue('0');
  expect(screen.queryByTestId('sha256-round-result')).not.toBeInTheDocument();
  chooseRound(44);
  expect(screen.getByTestId('sha256-round-result')).toHaveTextContent(ABC_ROUNDS[44]);
});

test('reinterprets the same characters as hex or text at the selected compression round', () => {
  setup('616263');
  chooseRound(44);
  const textResult = screen.getByTestId('sha256-round-result').textContent;
  const format = screen.getAllByLabelText('Input format')[0];
  fireEvent.change(format, { target: { value: 'hex' } });
  expect(screen.getAllByLabelText('Message')[0]).toHaveValue('616263');
  expect(screen.getByLabelText('Round')).toHaveValue('44');
  expect(screen.getByTestId('sha256-round-result')).toHaveTextContent(ABC_ROUNDS[44]);
  expect(screen.getByTestId('sha256-round-result').textContent).not.toBe(textResult);
  fireEvent.change(format, { target: { value: 'text' } });
  expect(screen.getAllByLabelText('Message')[0]).toHaveValue('616263');
  expect(screen.getByLabelText('Round')).toHaveValue('44');
  expect(screen.getByTestId('sha256-round-result')).toHaveTextContent(textResult);
});

test('updates the final digest immediately when the same input is interpreted in each format', () => {
  const input = '01100001';
  setup(input);
  clickControl('Skip to end');
  const format = screen.getAllByLabelText('Input format')[0];
  for (const [base, bytes] of [
    ['hex', Buffer.from(input, 'hex')],
    ['bin', Buffer.from([0x61])],
    ['text', Buffer.from(input, 'utf8')],
  ]) {
    fireEvent.change(format, { target: { value: base } });
    expect(screen.getAllByLabelText('Message')[0]).toHaveValue(input);
    expect(screen.getByTestId('sha256-final-hash')).toHaveTextContent(createHash('sha256').update(bytes).digest('hex'));
  }
});

test.each(['', 'abc', '你好 🔐 café', 'a'.repeat(55), 'a'.repeat(56), 'a'.repeat(64), 'a'.repeat(128)])(
  'preserves the full SHA-256 digest for %p', message => {
    setup(message);
    clickControl('Skip to end');
    expect(screen.getByTestId('sha256-final-hash')).toHaveTextContent(createHash('sha256').update(message).digest('hex'));
  }
);

test('inspects each block and clamps navigation when the message becomes shorter', () => {
  setup('a'.repeat(64));
  chooseRound(44);
  const firstBlockResult = screen.getByTestId('sha256-round-result').textContent;
  fireEvent.change(screen.getByLabelText('Block'), { target: { value: '1' } });
  expect(screen.getByLabelText('Round')).toHaveValue('44');
  expect(screen.getByTestId('sha256-round-result').textContent).not.toBe(firstBlockResult);
  fireEvent.change(screen.getByLabelText('Block'), { target: { value: '0' } });
  expect(screen.getByTestId('sha256-round-result')).toHaveTextContent(firstBlockResult);
  chooseRound(64);
  expect(screen.getByRole('region', { name: 'Compression result' })).toHaveTextContent('starting H₀..H₇ for the next block');
  for (let i = 0; i < 4; i++) clickControl('Step forward');
  expect(screen.getByText('✓ Block 1 result')).toBeVisible();
  expect(screen.queryByTestId('sha256-final-hash')).not.toBeInTheDocument();
  clickControl('Skip to end');
  expect(screen.getByTestId('sha256-final-hash')).toHaveTextContent(createHash('sha256').update('a'.repeat(64)).digest('hex'));
  fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'abc' } });
  expect(screen.queryByLabelText('Block')).not.toBeInTheDocument();
  expect(screen.getByTestId('sha256-final-hash')).toHaveTextContent(ABC_HASH);
});

test('playback follows the selected round and selecting a result pauses it', () => {
  jest.useFakeTimers();
  try {
    setup();
    chooseRound(43);
    clickControl('Play');
    expect(screen.getByTestId('sha256-round-result')).toHaveTextContent(ABC_ROUNDS[44]);
    act(() => { jest.advanceTimersByTime(60); });
    expect(screen.getByTestId('sha256-round-result')).toHaveTextContent(ABC_ROUNDS[45]);
    chooseRound(44);
    act(() => { jest.advanceTimersByTime(600); });
    expect(screen.getByLabelText('Round')).toHaveValue('44');
    expect(screen.getByTestId('sha256-round-result')).toHaveTextContent(ABC_ROUNDS[44]);
    expect(screen.getByTitle('Play')).toBeEnabled();
  } finally {
    jest.useRealTimers();
  }
});

test('verifies the screenshot collision in the app with a 38-round limit on every block', () => {
  setup('');
  fireEvent.change(screen.getAllByLabelText('Input format')[0], { target: { value: 'hex' } });
  fireEvent.change(screen.getAllByLabelText('Message')[0], { target: { value: COLLISION_MESSAGES[0] } });
  fireEvent.change(screen.getByLabelText('Block'), { target: { value: '2' } });
  chooseRound(38);
  // Merely pausing the last block at round 38 is a different computation:
  // the first two blocks still used all 64 rounds.
  expect(screen.getByTestId('sha256-round-result')).toHaveTextContent('77a34cd8bead2155620a66ca0fb05b14981a267c8f608bb48e10d8f76c0b61c0');
  fireEvent.change(screen.getByLabelText('Rounds per block'), { target: { value: '38' } });
  expect(screen.getByLabelText('Round')).toHaveValue('38');
  expect(screen.getByTestId('sha256-round-result')).toHaveTextContent(REDUCED_38_DIGEST);
  clickControl('Skip to end');
  expect(screen.getByText('✓ 38-Step Digest')).toBeVisible();
  expect(screen.queryByText('✓ SHA-256 Hash')).not.toBeInTheDocument();
  expect(screen.getByTestId('sha256-final-hash')).toHaveTextContent(REDUCED_38_DIGEST);

  const formattedHex = '0x' + COLLISION_MESSAGES[1].toUpperCase().match(/.{1,32}/g).join(' \n') + ' ';
  fireEvent.change(screen.getAllByLabelText('Message')[0], { target: { value: formattedHex } });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getAllByLabelText('Message')[0]).toHaveValue(formattedHex.replace(/[\r\n]/g, ''));
  expect(screen.getByTestId('sha256-final-hash')).toHaveTextContent(REDUCED_38_DIGEST);
  fireEvent.change(screen.getByLabelText('Block'), { target: { value: '1' } });
  expect(screen.getByTestId('sha256-round-result')).toHaveTextContent(REDUCED_38_BLOCK_2);
  clickControl('Skip to end');
  fireEvent.change(screen.getByLabelText('Rounds per block'), { target: { value: '64' } });
  expect(screen.getByText('✓ SHA-256 Hash')).toBeVisible();
  expect(screen.getByTestId('sha256-final-hash')).toHaveTextContent(FULL_DIGESTS[1]);
  fireEvent.change(screen.getAllByLabelText('Message')[0], { target: { value: COLLISION_MESSAGES[0] } });
  expect(screen.getByTestId('sha256-final-hash')).toHaveTextContent(FULL_DIGESTS[0]);
});

test('shows invalid hex instead of rejecting keystrokes or leaving a stale hash', () => {
  setup('');
  fireEvent.change(screen.getAllByLabelText('Input format')[0], { target: { value: 'hex' } });
  fireEvent.change(screen.getAllByLabelText('Message')[0], { target: { value: 'ABCD' } });
  clickControl('Skip to end');
  expect(screen.getByTestId('sha256-final-hash')).toHaveTextContent(createHash('sha256').update(Buffer.from('abcd', 'hex')).digest('hex'));
  for (const input of ['r', '12r4', 'a']) {
    fireEvent.change(screen.getAllByLabelText('Message')[0], { target: { value: input } });
    expect(screen.getAllByLabelText('Message')[0]).toHaveValue(input);
    expect(screen.getByRole('alert')).toHaveTextContent(input === 'a' ? 'two digits per byte' : 'Hex accepts');
    expect(screen.getByTitle('Play')).toBeDisabled();
    expect(screen.queryByTestId('sha256-final-hash')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sha256-round-result')).not.toBeInTheDocument();
  }
  fireEvent.change(screen.getAllByLabelText('Message')[0], { target: { value: '0x00 FF ' } });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  clickControl('Skip to end');
  expect(screen.getByTestId('sha256-final-hash')).toHaveTextContent(createHash('sha256').update(Buffer.from('00ff', 'hex')).digest('hex'));
});

test('switches a long hex message to literal text, updates every block, and switches back', () => {
  setup('');
  const format = screen.getAllByLabelText('Input format')[0];
  const message = screen.getAllByLabelText('Message')[0];
  fireEvent.change(format, { target: { value: 'hex' } });
  expect(message).toHaveValue('');
  const hex = COLLISION_MESSAGES[0];
  fireEvent.change(message, { target: { value: hex } });
  fireEvent.change(screen.getByLabelText('Rounds per block'), { target: { value: '38' } });
  chooseRound(38);
  const hexBlockResult = screen.getByTestId('sha256-round-result').textContent;
  fireEvent.change(format, { target: { value: 'text' } });
  expect(format).toHaveValue('text');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Round')).toHaveValue('38');
  expect(message).toHaveValue(hex);
  expect(screen.getByTestId('sha256-round-result').textContent).not.toBe(hexBlockResult);
  expect(within(screen.getByLabelText('Block')).getAllByRole('option')).toHaveLength(5);
  fireEvent.change(screen.getByLabelText('Block'), { target: { value: '4' } });
  fireEvent.change(format, { target: { value: 'hex' } });
  expect(screen.getByLabelText('Block')).toHaveValue('2');
  expect(screen.getByLabelText('Round')).toHaveValue('38');
  expect(screen.getByTestId('sha256-round-result')).toHaveTextContent(REDUCED_38_DIGEST);
  fireEvent.change(format, { target: { value: 'text' } });
  clickControl('Skip to end');
  expect(screen.getByTestId('sha256-final-hash')).toHaveTextContent(sha256Bytes(Buffer.from(hex, 'utf8'), 38));
  fireEvent.change(format, { target: { value: 'hex' } });
  expect(message).toHaveValue(hex);
  expect(within(screen.getByLabelText('Block')).getAllByRole('option')).toHaveLength(3);
  expect(screen.getByTestId('sha256-final-hash')).toHaveTextContent(REDUCED_38_DIGEST);
});

test('can switch invalid hex input to text and validate it again when switching back', () => {
  setup('r');
  const format = screen.getAllByLabelText('Input format')[0];
  fireEvent.change(format, { target: { value: 'hex' } });
  expect(screen.getByRole('alert')).toHaveTextContent('Hex accepts');
  expect(screen.queryByTestId('sha256-round-result')).not.toBeInTheDocument();
  fireEvent.change(format, { target: { value: 'text' } });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getAllByLabelText('Message')[0]).toHaveValue('r');
  clickControl('Skip to end');
  expect(screen.getByTestId('sha256-final-hash')).toHaveTextContent(createHash('sha256').update('r').digest('hex'));
  fireEvent.change(format, { target: { value: 'hex' } });
  expect(screen.getByRole('alert')).toHaveTextContent('Hex accepts');
  expect(screen.queryByTestId('sha256-final-hash')).not.toBeInTheDocument();
});
