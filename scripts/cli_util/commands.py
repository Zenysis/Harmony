from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Union
import os

from pylib.base.flags import Flags
from pylib.base.term_color import TermColor
import __main__


def _get_all_cli_flags() -> dict:
    '''Get all possible CLI flags'''
    # pylint:disable=protected-access
    return Flags.PARSER._optionals._option_string_actions


def _is_flag_zero_arity(flag: str) -> bool:
    '''Checks if a given flag takes no arguments
    The flag must be formatted including any leading dashes (e.g. '--flag')
    '''
    return _get_all_cli_flags()[flag].nargs == 0


class CommandStatus:
    SUCCESS = 'SUCCESS'
    SUCCESS_WITH_TOO_MANY_ARGS = 'SUCCESS_WITH_TOO_MANY_ARGS'
    ERROR_MISSING_ARGUMENTS = 'MISSING_ARGUMENTS'


class Command:
    '''Represents a Command instance for a CLI tool. Do not instantiate a Command
    directly. Instead, use `Command.register_command` to register a command to
    your CLI.

    Args:
        name (str): the name of the command
        func (Callable): the function to call. It takes no arguments. It can
            return anything because the return value will be ignored.
        description (str): the description for this command
        params (list of ParamCombination): a list of ParamCombination instances.
            Each ParamCombination represents a valid way of calling this command.
    '''

    # list of all registered commands
    COMMANDS: List['Command'] = []

    # dict mapping name to registered command
    COMMANDS_MAP: Dict[str, 'Command'] = {}

    INITIALIZED = False
    MISSING_FLAGS = False

    class ParamCombination:
        '''A single command can have lots of different valid ways of calling it,
        so a ParamCombination represents a single valid way of calling a Command.
        It consists of a set of required parameters and a set of optional
        parameters. It is okay if either or both of these sets are empty, or None.

        NOTE(pablo):
            - All parameters must be specified exactly as the user must supply them.
            Meaning '--deployment_name' is expected, instead of 'deployment_name'.
            - All parameters must be registered via `Flags.PARSER.add_argument`
            otherwise your CLI won't work.

        Args:
            required_params (None, str, List[str] or Tuple[str, ...]):
                The required parameters. If these parameters are not supplied
                when calling the Command, then this ParamCombination will be
                considered unsatisfied. If `None` is supplied, then there are
                no required parameters.
            optional_params (None, str, List[str] or Tuple[str, ...]):
                The optional parameters. It is okay if these parameters are
                not supplied by the user when calling the Command.
        '''

        def __init__(
            self,
            required_params: Union[None, str, List[str], Tuple[str, ...]] = None,
            optional_params: Union[None, str, List[str], Tuple[str, ...]] = None,
            description: Optional[str] = None,
        ):
            reqs = set()
            opts = set()

            if isinstance(required_params, str):
                reqs = set([required_params])
            elif required_params:
                reqs = set(required_params)

            if isinstance(optional_params, str):
                opts = set([optional_params])
            elif optional_params:
                opts = set(optional_params)

            self.required_params: Set[str] = reqs
            self.optional_params: Set[str] = opts
            self.description = description

        def are_requirements_satisfied(self, params_set_by_user: Set[str]) -> bool:
            '''Given a set of parameters that the user has passed, check if
            these satisfy this ParamCombination's set of required params.

            Args:
                params_set_by_user (set of str): the parameters the user has passed
                    to the command.

            Returns:
                bool
                True if the required parameters are included in `params_set_by_user`
            '''
            if len(self.required_params) == 0:
                return True

            formatted_params = set(p.lstrip('-') for p in params_set_by_user)
            reqs = set(p.lstrip('-') for p in self.required_params)
            for req in reqs:
                if req not in formatted_params:
                    return False
            return True

        def get_unnecessary_args(self, params_set_by_user: Set[str]) -> Set[str]:
            '''Given a set of parameters that the user has passed, check which ones
            are unnecessary for this ParamCombination. Meaning, they are neither
            required nor optional parameters in this ParamCombination.

            Args:
                params_set_by_user: (set of str): the parameters the user has passed
                    to the command.

            Returns:
                Set[str]
                A set of unnecessary arguments the user has passed in.
            '''
            # strip all leading dashes from the parameters to make sure they are
            # safe to compare
            formatted_params = set(p.lstrip('-') for p in params_set_by_user)
            reqs = set(p.lstrip('-') for p in self.required_params)
            opts = set(p.lstrip('-') for p in self.optional_params)
            return set(p for p in formatted_params if p not in opts and p not in reqs)

        def collect_values_from_flags(self) -> Dict[str, Any]:
            '''Collect all values from Flags.ARGS for this parameter combination
            Returns:
                A dict mapping param name to the value passed by the user
            '''
            all_params = self.required_params.union(self.optional_params)
            vals = {}
            for param in all_params:
                name = param.lstrip('-')
                parameter_val = getattr(Flags.ARGS, name)
                if parameter_val is not None:
                    vals[name] = parameter_val
            return vals

    @staticmethod
    def initialize_commands() -> None:
        '''This function initializes your CLI tool with basic commands to help the
        user, such as `command:help` and `list:commands`. Your CLI will not work
        until you call this function first.

        NOTE(pablo): by calling this function you no longer need to call
        Flags.InitArgs().
        '''
        Flags.PARSER.add_argument(
            'command',
            type=str,
            help=TermColor.ColorStr(
                'The command to run. Use `list_commands` to list all available commands.',
                'GREEN',
            ),
        )

        Flags.PARSER.add_argument(
            '--command_name',
            type=str,
            required=False,
            help='The command name whose documentation we want to print for `command:help`',
        )

        Command.register_command(
            name='help',
            description=(
                'Shows the documentation for a command. To list all available '
                'commands, use the `list_commands` command.'
            ),
            func=print_command_help,
            params=[
                Command.ParamCombination(
                    required_params='--command_name', optional_params=None
                )
            ],
        )

        Command.register_command(
            name='list_commands',
            description='Lists all available commands',
            func=Command.print_all_commands,
        )

        # validate that all commands have registered all Flags with Flags.PARSER
        all_cmd_param_names = set()
        for cmd in Command.COMMANDS:
            for p_name in cmd.get_all_param_names():
                all_cmd_param_names.add(p_name)

        all_registered_flags = set(_get_all_cli_flags().keys())
        all_params_are_registered = True
        for p_name in all_cmd_param_names:
            if p_name not in all_registered_flags:
                all_params_are_registered = False
                print(TermColor.ColorStr(f"Missing CLI flag: '{p_name}'", 'RED'))

        Flags.InitArgs()
        if all_params_are_registered:
            Command.INITIALIZED = True
        else:
            Command.MISSING_FLAGS = True

    @staticmethod
    # pylint: disable=redefined-builtin
    def register_command(
        name: str,
        func: Callable[[], Any],
        description: str,
        params: Optional[List['Command.ParamCombination']] = None,
    ) -> None:
        '''Register a command for your CLI tool.

        Args:
            name (str): the name of the command
            func (Callable): the function to call. It takes no arguments. It can
                return anything because the return value will be ignored.
            description (str): the description for this command
            params (list of ParamCombination): (optional) a list of ParamCombination
                instances. Each ParamCombination represents a valid way of calling
                this command.
        '''
        param_combinations = params or [
            Command.ParamCombination(required_params=None, optional_params=None)
        ]
        cmd = Command(
            name=name, func=func, description=description, params=param_combinations
        )
        Command.COMMANDS.append(cmd)
        Command.COMMANDS_MAP[cmd.name] = cmd

    @staticmethod
    def is_valid_command(cmd_name: str) -> bool:
        '''Check if a given command name has been registered'''
        return cmd_name in Command.COMMANDS_MAP

    @staticmethod
    def get_command(cmd_name: str) -> Union['Command', None]:
        '''Get the Command instance of a given command name

        Returns:
            Command (if cmd_name exists), or None
        '''
        if cmd_name in Command.COMMANDS_MAP:
            return Command.COMMANDS_MAP[cmd_name]
        return None

    @staticmethod
    def print_all_commands() -> None:
        '''Print all registered commands'''
        cmd_names = [c.name for c in Command.COMMANDS]
        cmd_names.sort()

        for cmd_name in cmd_names:
            Command.get_command(cmd_name).print_command()

    @staticmethod
    def run(command: str) -> None:
        '''Executes the command if it is a valid registered command. Otherwise,
        prints an error message and the list of all commands.
        '''
        if not Command.INITIALIZED:
            intro_msg = 'Commands have not been initialized.'
            if Command.MISSING_FLAGS:
                print(
                    TermColor.ColorStr(
                        f'{intro_msg} All command parameters need to be added to Flags.PARSER',
                        'RED',
                    )
                )
            else:
                print(
                    TermColor.ColorStr(
                        (
                            f'{intro_msg} You must call `Command.initialize_commands()` '
                            'before you can call `Command.run()`'
                        ),
                        'RED',
                    )
                )
            return

        if not Command.is_valid_command(command):
            print(
                TermColor.ColorStr(
                    (
                        'The command you supplied does not exist. '
                        'This is the list of available commands:'
                    ),
                    'RED',
                )
            )
            Command.print_all_commands()
            return

        Command.get_command(command).execute_command()

    # pylint: disable=redefined-builtin
    def __init__(
        self,
        name: str,
        func: Callable[[], None],
        description: str,
        params: List['Command.ParamCombination'],
    ):
        self.name = name
        self.func = func
        self.description = description
        self.params = params

    def get_all_param_names(self) -> Set[str]:
        '''Get all the param names for this command. The param name strings are
        as specified in the ParamCombination instances, and have not been cleaned
        up by removing any leading dashes.

        Returns:
            List[str] - param names
        '''
        all_params: Set[str] = set()
        for param_combination in self.params:
            for p in param_combination.required_params:
                all_params.add(p)
            for p in param_combination.optional_params:
                all_params.add(p)
        return all_params

    def print_command(self) -> None:
        '''Print the command name along with its description'''
        print(TermColor.ColorStr(self.name, 'AUQA'))
        print(f'\t{self.description}')

    def print_documentation(self) -> None:
        '''Print this command's documentation on how to execute it'''
        print(TermColor.ColorStr(f'\t{self.name}\n', 'BOLD'))
        print(TermColor.ColorStr(f'{self.description}\n', 'AUQA'))
        print('How to call:\n')

        scriptname = os.path.basename(__main__.__file__)
        num_combinations = len(self.params)
        for i, param_combination in enumerate(self.params):
            reqs = list(param_combination.required_params)
            opts = list(param_combination.optional_params)

            # sort the parameters just to make sure we always print them in
            # the same order across multiple calls
            reqs.sort()
            opts.sort()

            req_str = ''
            opt_str = ''

            if len(reqs) > 0:
                req_strs = []
                for req in reqs:
                    # pylint:disable=protected-access
                    if _is_flag_zero_arity(req):
                        req_strs.append(req)
                    else:
                        req_strs.append('%s %s' % (req, req.lstrip('-').upper()))
                req_str = ' '.join(req_strs)

            if len(opts) > 0:
                opt_strs = []
                for opt in opts:
                    # pylint:disable=protected-access
                    if _is_flag_zero_arity(opt):
                        opt_strs.append(f'[{opt}]')
                    else:
                        opt_strs.append('[%s %s]' % (opt, opt.lstrip('-').upper()))

                opt_str = ' '.join(opt_strs)

            cmd_str = TermColor.ColorStr(
                ' '.join([scriptname, self.name, req_str, opt_str]), 'YELLOW'
            )

            index = i + 1
            desc = param_combination.description or ''
            index_str = f'{index}. ' if num_combinations > 1 else ''
            if desc:
                print(f'{index_str}{desc}')
                print(f'\t{cmd_str}\n')
            else:
                print(f'{index_str}\t{cmd_str}\n')

    def execute_command(self) -> str:
        '''Execute this command.

        Returns:
            A CommandStatus string. This is mainly used for testing purposes.
        '''
        # collect which parameters have been set by the user in the CLI Flags
        params_set_by_user: Set[str] = set()

        for flag_name, flag_config in _get_all_cli_flags().items():
            arg_name = flag_name.lstrip('-')
            if hasattr(Flags.ARGS, arg_name):
                val = getattr(Flags.ARGS, arg_name)
                ignore_flag = (
                    flag_name == '-v' or flag_name == '--verbose' or val is None
                )
                if not ignore_flag and (
                    not _is_flag_zero_arity(flag_name) or flag_config.default != val
                ):

                    params_set_by_user.add(arg_name)

        # let's check if any valid required/optional param combinations
        # are satisfied
        param_combination_satisfied = None
        for param_combination in self.params:
            if param_combination.are_requirements_satisfied(params_set_by_user):
                param_combination_satisfied = param_combination
                break

        if param_combination_satisfied:
            # first, tell the user which unnecessary args were passed
            unnecessary_args = param_combination_satisfied.get_unnecessary_args(
                params_set_by_user
            )

            command_args = param_combination_satisfied.collect_values_from_flags()

            if len(unnecessary_args) > 0:
                unnecessary_args_str = ', '.join(unnecessary_args)
                print(
                    TermColor.ColorStr(
                        # pylint:disable=line-too-long
                        f'The following arguments were ignored because they were not needed: {unnecessary_args_str}',
                        'YELLOW',
                    )
                )
                print('Now running the command...\n')
                self.func(**command_args)
                return CommandStatus.SUCCESS_WITH_TOO_MANY_ARGS

            self.func(**command_args)
            return CommandStatus.SUCCESS

        # if we're missing arguments then print the documentation
        print(
            TermColor.ColorStr(
                "This command is missing some arguments. Here's the documentation:\n",
                'RED',
            )
        )
        self.print_documentation()
        return CommandStatus.ERROR_MISSING_ARGUMENTS


def print_command_help(command_name: str) -> None:
    cmd = Command.get_command(command_name)
    if cmd:
        cmd.print_documentation()
    else:
        print(TermColor.ColorStr(f"Could not find command '{command_name}'", 'RED'))
        print('Here is the list of available commands:')
        Command.print_all_commands()
