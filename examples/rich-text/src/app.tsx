import React, { useState, PropsWithChildren, Ref } from 'react';
import { cx, css } from 'emotion';

import { Icon } from './components';

import RichText from './rich-text';
import { useExampleData, FluidContext } from './utils';

const Header = props => (
  <div
    {...props}
    className={css`
      align-items: center;
      background: #000;
      color: #aaa;
      display: flex;
      height: 42px;
      position: relative;
      z-index: 1; /* To appear above the underlay */
    `}
  />
);

const Title = props => (
  <span
    {...props}
    className={css`
      margin-left: 1em;
    `}
  />
);

const LinkList = props => (
  <div
    {...props}
    className={css`
      margin-left: auto;
      margin-right: 1em;
    `}
  />
);

const A = props => (
  <a
    {...props}
    className={css`
      margin-left: 1em;
      color: #aaa;
      text-decoration: none;

      &:hover {
        color: #fff;
        text-decoration: underline;
      }
    `}
  />
);

const TabList = ({ isVisible, ...props }) => (
  <div
    {...props}
    className={css`
      background-color: #222;
      display: flex;
      flex-direction: column;
      overflow: auto;
      padding-top: 0.2em;
      position: absolute;
      transition: width 0.2s;
      width: ${isVisible ? '200px' : '0'};
      white-space: nowrap;
      max-height: 70vh;
      z-index: 1; /* To appear above the underlay */
    `}
  />
);

const TabListUnderlay = ({ isVisible, ...props }) => (
  <div
    {...props}
    className={css`
      background-color: rgba(200, 200, 200, 0.8);
      display: ${isVisible ? 'block' : 'none'};
      height: 100%;
      top: 0;
      position: fixed;
      width: 100%;
    `}
  />
);

const TabButton = props => (
  <span
    {...props}
    className={css`
      margin-left: 0.8em;

      &:hover {
        cursor: pointer;
      }

      .material-icons {
        color: #aaa;
        font-size: 24px;
      }
    `}
  />
);
React.forwardRef(
  (
    {
      active,
      href,
      ...props
    }: PropsWithChildren<{
      active: boolean;
      href: string;
      [key: string]: unknown;
    }>,
    ref: Ref<HTMLAnchorElement | null>,
  ) => (
    <a
      ref={ref}
      href={href}
      {...props}
      className={css`
        display: inline-block;
        margin-bottom: 0.2em;
        padding: 0.2em 1em;
        border-radius: 0.2em;
        text-decoration: none;
        color: ${active ? 'white' : '#777'};
        background: ${active ? '#333' : 'transparent'};

        &:hover {
          background: #333;
        }
      `}
    />
  ),
);
const Wrapper = ({ className, ...props }) => (
  <div
    {...props}
    className={cx(
      className,
      css`
        max-width: 42em;
        margin: 20px auto;
        padding: 20px;
      `,
    )}
  />
);

const ExampleHeader = props => (
  <div
    {...props}
    className={css`
      align-items: center;
      background-color: #555;
      color: #ddd;
      display: flex;
      height: 42px;
      position: relative;
      z-index: 1; /* To appear above the underlay */
    `}
  />
);

const ExampleTitle = props => (
  <span
    {...props}
    className={css`
      margin-left: 1em;
    `}
  />
);

const ExampleContent = props => (
  <Wrapper
    {...props}
    className={css`
      background: #fff;
    `}
  />
);

const Warning = props => (
  <Wrapper
    {...props}
    className={css`
      background: #fffae0;

      & > pre {
        background: #fbf1bd;
        white-space: pre;
        overflow-x: scroll;
        margin-bottom: 0;
      }
    `}
  />
);

function getUrlParam(name) {
  const reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)');
  const r = window.location.search.substr(1).match(reg);
  if (r != null) {
    return unescape(r[2]);
  } else {
    return null;
  }
}

const App = () => {
  const id = getUrlParam('id');
  const isNew = getUrlParam('isNew');

  console.log(id, isNew);

  const context = useExampleData(id, isNew);
  console.log('context', context);
  const [error] = useState<Error | undefined>();
  const [stacktrace] = useState<string | undefined>();
  const [showTabs, setShowTabs] = useState<boolean>();
  const [name, Component, path] = ['Rich Text', RichText, 'richtext'];
  return (
    <div>
      <div>
        <title>Slate Examples</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Roboto:400,400i,700,700i&subset=latin-ext"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
        />
        <Header>
          <Title>Slate Examples</Title>
          <LinkList>
            <A href="https://github.com/ianstormtaylor/slate">GitHub</A>
            <A href="https://docs.slatejs.org/">Docs</A>
          </LinkList>
        </Header>
        <ExampleHeader>
          <TabButton
            onClick={e => {
              e.stopPropagation();
              setShowTabs(!showTabs);
            }}
          >
            <Icon>menu</Icon>
          </TabButton>
          <ExampleTitle>
            {name}
            <A
              href={`https://github.com/ianstormtaylor/slate/blob/master/site/examples/${path}.tsx`}
            >
              (View Source)
            </A>
          </ExampleTitle>
        </ExampleHeader>
        <TabList isVisible={showTabs} />
        {error ? (
          <Warning>
            <p>
              An error was thrown by one of the example&apos;s React components!
            </p>
            <pre>
              <code>
                {error.stack}
                {'\n'}
                {stacktrace}
              </code>
            </pre>
          </Warning>
        ) : (
          <ExampleContent>
            {context ? (
              <FluidContext.Provider value={context}>
                {' '}
                <Component />{' '}
              </FluidContext.Provider>
            ) : (
              <div />
            )}
          </ExampleContent>
        )}
        <TabListUnderlay
          isVisible={showTabs}
          onClick={() => setShowTabs(false)}
        />
      </div>
    </div>
  );
};
export default App;
